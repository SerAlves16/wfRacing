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
test('new race preserves race 1, creates an empty race 2 and updates the active numpad', async () => {
  const before = await Dados.find({corrida:1}).lean();
  const currentSettings = (await request('/api/settings','GET',admin)).body.at(-1);
  assert.equal(currentSettings.numberCorrida,1);
  assert.equal((await request('/api/races/new','POST',null,{currentRace:1})).status,401);
  assert.equal((await request('/api/races/new','POST',user,{currentRace:1})).status,403);
  assert.equal((await request('/api/races/new','POST',admin,{currentRace:'1'})).status,400);
  const attempts = await Promise.all([
    request('/api/races/new','POST',admin,{currentRace:1}), request('/api/races/new','POST',admin,{currentRace:1})
  ]);
  assert.deepEqual(attempts.map(result=>result.status).sort(),[201,409]);
  const created = attempts.find(result=>result.status===201).body;
  assert.equal(created.number,2); assert.equal(created.session.number,2);
  assert.deepEqual(await Dados.find({corrida:1}).lean(),before);
  assert.equal(await Dados.countDocuments({corrida:2}),0);
  const afterSettings = (await request('/api/settings','GET',user)).body.at(-1);
  assert.equal(afterSettings.numberCorrida,2); assert.equal(afterSettings.numberButtons,currentSettings.numberButtons);
  const sessions = (await request('/api/races','GET',user)).body;
  assert.equal(sessions.length,1); assert.equal(sessions[0].number,2);
  assert.equal((await request('/api/incidents','POST',admin,{corrida:2,curva:'Start',hora:'11:00:00'})).status,200);
  assert.equal((await request('/api/incidents','POST',admin,{corrida:2,curva:'Turn 1',hora:'11:01:00'})).status,200);
  assert.deepEqual(await Dados.find({corrida:1}).lean(),before);
  // After switching back to an older race, allocation still avoids reusing race 2.
  assert.equal((await request('/api/settings/'+afterSettings._id,'PATCH',admin,{numberCorrida:1})).status,200);
  const next = await request('/api/races/new','POST',operator,{currentRace:1});
  assert.equal(next.status,201); assert.equal(next.body.number,3);
});

test('Start posts immediately, rejects duplicates and permits a restart after Red Flag', async () => {
  const start = { corrida: 99, curva: 'Start', hora: '12:00:00', camera: '', video: false, report: false, nfa: null, priority: false, obs: 'Race Nº:99' };
  const attempts = await Promise.all([request('/api/incidents','POST',admin,start), request('/api/incidents','POST',admin,start)]);
  assert.deepEqual(attempts.map(result => result.status).sort(), [200,409]);
  assert.equal((await request('/api/incidents','POST',admin,start)).status,409);
  const saved = await Dados.find({ corrida: 99, curva: 'Start' });
  assert.equal(saved.length,1); assert.equal(saved[0].hora,'12:00:00'); assert.equal(saved[0].obs,'Race Nº:99');
  assert.equal((await request('/api/incidents','POST',admin,{corrida:99,curva:'Red Flag',hora:'12:10:00'})).status,200);
  assert.equal((await request('/api/incidents','POST',admin,{...start,hora:'12:11:00'})).status,200);
  assert.equal(await Dados.countDocuments({corrida:99,curva:'Start'}),2);
});
test('a restart needs a new Red Flag in the same race; Slow Flag and old flags do not qualify', async () => {
  const event = (corrida, curva) => ({ corrida, curva, hora: '14:00:00' });
  assert.equal((await request('/api/incidents','POST',admin,event(101,'Red Flag'))).status,200);
  assert.equal((await request('/api/incidents','POST',admin,event(101,'Start'))).status,200);
  assert.equal((await request('/api/incidents','POST',admin,event(101,'Slow Flag'))).status,200);
  assert.equal((await request('/api/incidents','POST',admin,event(102,'Red Flag'))).status,200);
  assert.equal((await request('/api/incidents','POST',admin,event(101,'Start'))).status,409);
  assert.equal((await request('/api/incidents','POST',admin,event(101,' start '))).status,409);
  assert.equal((await request('/api/incidents','POST',admin,event(101,'Red Flag'))).status,200);
  assert.equal((await request('/api/incidents','POST',admin,event(101,'Turn 5'))).status,200);
  const restarts = await Promise.all([request('/api/incidents','POST',admin,event(101,'Start')),request('/api/incidents','POST',admin,event(101,'Start'))]);
  assert.deepEqual(restarts.map(result=>result.status).sort(),[200,409]);
  assert.equal((await request('/api/incidents','POST',admin,event(101,'Start'))).status,409);
});

test('editing or removing a necessary Red Flag cannot invalidate an existing restart', async () => {
  const event = curva => ({ corrida: 103, curva, hora: '15:00:00' });
  for (const curva of ['Start','Red Flag','Start','Turn 1']) assert.equal((await request('/api/incidents','POST',admin,event(curva))).status,200);
  const rows = await Dados.find({corrida:103}).sort({_id:1});
  const [first, red, restart, normal] = rows;
  assert.equal((await request('/api/incidents/'+red._id,'DELETE',admin)).status,409);
  assert.equal((await request('/api/incidents/'+red._id,'PATCH',admin,{curva:'Slow Flag'})).status,409);
  assert.equal((await request('/api/incidents/'+red._id,'PATCH',admin,{corrida:104})).status,409);
  assert.equal((await request('/api/incidents/'+normal._id,'PATCH',admin,{curva:'Start'})).status,409);
  assert.equal((await request('/api/incidents/'+restart._id,'PATCH',admin,{obs:'Correção de observações',hora:'15:10:00'})).status,200);
  assert.equal((await request('/api/incidents/reorder','POST',admin,{id:String(first._id),adjacentId:String(red._id)})).status,200);
  assert.equal((await request('/api/incidents','POST',admin,event('Start'))).status,409);
  assert.equal((await Dados.findById(red._id)).curva,'Red Flag');
  // A correction can remove the restart first, then remove its now-unused Red Flag.
  assert.equal((await request('/api/incidents/'+restart._id,'DELETE',admin)).status,200);
  assert.equal((await request('/api/incidents/'+red._id,'DELETE',admin)).status,200);
});

test('existing invalid histories remain readable and editable without allowing new invalid starts', async () => {
  // Simulate legacy data; the application must not invent or delete historical records.
  await Dados.create([{corrida:105,curva:'Start',hora:'16:00:00'},{corrida:105,curva:'Start',hora:'16:01:00'}]);
  const row = await Dados.findOne({corrida:105});
  assert.equal((await request('/api/incidents/'+row._id,'PATCH',admin,{obs:'Nota histórica'})).status,200);
  assert.equal((await request('/api/incidents','POST',admin,{corrida:105,curva:'Start',hora:'16:02:00'})).status,409);
  assert.equal((await request('/api/incidents','POST',admin,{corrida:105,curva:'Red Flag',hora:'16:03:00'})).status,200);
  assert.equal((await request('/api/incidents','POST',admin,{corrida:105,curva:'Start',hora:'16:04:00'})).status,200);
});

test('only admins can list and manage users, passwords stay private and optional during edits', async () => {
  assert.equal((await request('/api/auth/users','GET')).status,401);
  assert.equal((await request('/api/auth/users','GET',user)).status,403);
  assert.equal((await request('/api/auth/users','GET',operator)).status,403);
  const listing = await request('/api/auth/users','GET',admin);
  assert.equal(listing.status,200);
  for (const account of listing.body) assert.deepEqual(Object.keys(account).sort(),['id','username','usertype']);
  const created = await request('/api/auth/register','POST',admin,{username:'managed-user',password:'initial-password',usertype:'user'});
  assert.equal(created.status,201);
  const id = created.body.id;
  const beforeLogin = await request('/api/auth/login','POST',null,{username:'managed-user',password:'initial-password'});
  const beforeToken = beforeLogin.body.token;
  assert.equal((await request('/api/auth/edit/'+id,'PUT',user,{username:'hacked'})).status,403);
  assert.equal((await request('/api/auth/edit/'+id,'PUT',admin,{username:'managed-operator',usertype:'operator'})).status,200);
  assert.equal((await request('/api/auth/login','POST',null,{username:'managed-operator',password:'initial-password'})).status,200);
  assert.equal((await request('/api/auth/edit/'+id,'PUT',admin,{usertype:'root'})).status,400);
  assert.equal((await request('/api/auth/edit/'+id,'PUT',admin,{password:'short'})).status,400);
  assert.equal((await request('/api/auth/edit/'+id,'PUT',admin,{password:'replacement-password'})).status,200);
  assert.equal((await request('/api/auth/protected','GET',beforeToken)).status,401);
  assert.equal((await request('/api/auth/login','POST',null,{username:'managed-operator',password:'initial-password'})).status,401);
  const afterLogin = await request('/api/auth/login','POST',null,{username:'managed-operator',password:'replacement-password'});
  assert.equal(afterLogin.status,200);
  assert.equal((await request('/api/auth/delete/'+id,'DELETE',admin)).status,200);
  assert.equal((await request('/api/auth/protected','GET',afterLogin.body.token)).status,401);
});

test('admins cannot delete or demote themselves and concurrent deletes cannot remove every admin', async () => {
  const mainAdmin = await User.findOne({username:'admin'});
  assert.equal((await request('/api/auth/delete/'+mainAdmin.id,'DELETE',admin)).status,409);
  assert.equal((await request('/api/auth/edit/'+mainAdmin.id,'PUT',admin,{usertype:'user'})).status,409);
  const second = await request('/api/auth/register','POST',admin,{username:'second-admin',password:'second-password',usertype:'admin'});
  const secondToken = (await request('/api/auth/login','POST',null,{username:'second-admin',password:'second-password'})).body.token;
  const attempts = await Promise.all([
    request('/api/auth/delete/'+second.body.id,'DELETE',admin),
    request('/api/auth/delete/'+mainAdmin.id,'DELETE',secondToken)
  ]);
  assert.equal(attempts.filter(result=>result.status===200).length,1);
  assert.equal(await User.countDocuments({usertype:'admin'}),1);
});

test('database role changes and account deletion invalidate old privileges', async () => {
  await User.updateOne({username:'operator'},{usertype:'user'});
  assert.equal((await request('/api/races','POST',operator,{race:'Forbidden'})).status,403);
  await User.deleteOne({username:'operator'});
  assert.equal((await request('/api/auth/protected','GET',operator)).status,401);
});
