const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
process.env.JWT_SECRET = require('node:crypto').randomBytes(48).toString('hex');
const { app } = require('../server');
const User = require('../server/src/models/models');
const Dados = require('../server/src/models/schema');
let database, server, base, admin, operator, user;
async function request(path, method = 'GET', token, body) {
  const response = await fetch(base + path, { method, headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const text = await response.text();
  return { status: response.status, body: response.headers.get('content-type')?.includes('json') ? JSON.parse(text) : text };
}
before(async () => {
  database = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
  await mongoose.connect(database.getUri());
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = 'http://127.0.0.1:' + server.address().port;
  for (const role of ['admin', 'operator', 'user']) await User.create({ username: role, password: await bcrypt.hash('testing-password', 10), usertype: role });
  admin = (await request('/api/auth/login', 'POST', null, { username: 'admin', password: 'testing-password' })).body.token;
  operator = (await request('/api/auth/login', 'POST', null, { username: 'operator', password: 'testing-password' })).body.token;
  user = (await request('/api/auth/login', 'POST', null, { username: 'user', password: 'testing-password' })).body.token;
}, { timeout: 180000 });
after(async () => { if (server) await new Promise(resolve => server.close(resolve)); await mongoose.disconnect(); if (database) await database.stop(); });
test('public pages load, backend files remain private, and database is healthy', async () => {
  for (const path of ['/', '/admin.html', '/cliente.html', '/manifest.webmanifest']) assert.equal((await request(path)).status, 200);
  for (const path of ['/server.js', '/.env', '/models/models.js', '/ExportedObs/local.obsOptions.json']) assert.notEqual((await request(path)).status, 200);
  assert.equal((await request('/health')).body.database, 'connected');
});
test('login rejects injection and invalid passwords; tokens contain only identity', async () => {
  assert.equal((await request('/api/auth/login', 'POST', null, { username: { $ne: null }, password: 'testing-password' })).status, 400);
  assert.equal((await request('/api/auth/login', 'POST', null, { username: 'admin', password: 'wrong' })).status, 401);
  const decoded = jwt.decode(admin);
  assert.ok(decoded.sub); assert.equal(decoded.data, undefined); assert.equal(decoded.password, undefined);
  const protectedResponse = await request('/api/auth/protected', 'GET', admin);
  assert.equal(protectedResponse.status, 200); assert.equal(protectedResponse.body.user.usertype, 'admin'); assert.equal(protectedResponse.body.user.password, undefined);
});
test('all legacy data endpoints require authentication', async () => {
  for (const [path, method] of [['/api/incidents','GET'],['/api/settings','GET'],['/api/observations','GET'],['/api/races/current','GET'],['/api/incidents','POST'],['/api/incidents','POST'],['/api/races','POST'],['/api/incidents/reorder','POST']]) assert.equal((await request(path,method)).status,401);
});
test('user management requires administrator and enforces password rules', async () => {
  const payload = { username: 'new-user', password: 'new-password', usertype: 'operator' };
  assert.equal((await request('/api/auth/register','POST',null,payload)).status,401);
  assert.equal((await request('/api/auth/register','POST',user,payload)).status,403);
  assert.equal((await request('/api/auth/register','POST',admin,{...payload,password:'short'})).status,400);
  const registered = await request('/api/auth/register','POST',admin,payload); assert.equal(registered.status,201);
  assert.equal((await request('/api/auth/register','POST',admin,payload)).status,409);
  assert.equal((await request('/api/auth/edit/'+registered.body.id,'PUT',admin,{ username:'edited',password:'edited-password' })).status,200);
  assert.equal((await request('/api/auth/delete/'+registered.body.id,'DELETE',admin)).status,200);
  assert.equal((await request('/api/auth/edit/invalid','PUT',admin,payload)).status,400);
});
test('incident creation, validation, editing and reorder preserve document identity', async () => {
  assert.equal((await request('/api/incidents','POST',user,{corrida:1,camera:'A',curva:'Turn 1',hora:'12:01',nfa:null})).status,200);
  assert.equal((await request('/api/incidents','POST',user,{corrida:1,camera:'B',curva:'Turn 2',hora:'12:02'})).status,200);
  assert.equal((await request('/api/incidents','POST',user,{corrida:-1})).status,400);
  assert.equal((await request('/api/incidents','POST',user,{$set:{obs:'injection'}})).status,400);
  let data = (await request('/api/incidents','GET',user)).body;
  const [first, second] = data;
  assert.equal((await request('/api/incidents/'+first._id,'PATCH',operator,{obs:'reviewed',priority:true})).status,200);
  assert.equal((await request('/api/incidents/'+first._id,'PATCH',user,{camera:'C'})).status,200);
  assert.equal((await request('/api/incidents/invalid','PATCH',user,{obs:'x'})).status,400);
  assert.equal((await request('/api/incidents/reorder','POST',user,{id:first._id,adjacentId:second._id})).status,200);
  data = (await request('/api/incidents','GET',user)).body;
  assert.equal(data[0]._id,second._id); assert.equal(data[0].camera,'B'); assert.equal(data[1]._id,first._id); assert.equal(data[1].camera,'C');
  assert.equal((await request('/api/incidents','DELETE',user)).status,403);
  assert.equal((await request('/api/incidents/'+first._id,'DELETE',user)).status,200);
});
test('configuration allows operators, collection clearing requires administrators', async () => {
  assert.equal((await request('/api/settings','POST',user,{numberButtons:8,numberCorrida:1})).status,403);
  assert.equal((await request('/api/settings','POST',operator,{numberButtons:'8',numberCorrida:'1'})).status,200);
  const config = (await request('/api/settings','GET',user)).body[0];
  assert.equal((await request('/api/settings/'+config._id,'PATCH',operator,{numberButtons:12})).status,200);
  assert.equal((await request('/api/settings/'+config._id,'PATCH',operator,{numberButtons:501})).status,400);
  assert.equal((await request('/api/settings','DELETE',operator)).status,403);
  assert.equal((await request('/api/observations','POST',operator,{descricao:'Contact'})).status,200);
  assert.equal((await request('/api/races','POST',operator,{race:'Race A'})).status,201);
  assert.equal((await request('/api/races/current','GET',user)).body.lastRaceText,'Race A');
});
test('database role changes and account deletion invalidate old privileges', async () => {
  await User.updateOne({username:'operator'},{usertype:'user'});
  assert.equal((await request('/api/races','POST',operator,{race:'Forbidden'})).status,403);
  await User.deleteOne({username:'operator'});
  assert.equal((await request('/api/auth/protected','GET',operator)).status,401);
});
