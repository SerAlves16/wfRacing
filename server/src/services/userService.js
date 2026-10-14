const bcrypt = require('bcrypt');
const User = require('../models/models');
const roles = ['admin', 'operator', 'user'];
const fail = (status, message) => Object.assign(new Error(message), { status });
const validName = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 100;
const validPassword = value => typeof value === 'string' && value.length >= 8 && Buffer.byteLength(value) <= 72;
let userQueue = Promise.resolve();
function manage(actorId, action) {
  const result = userQueue.then(async () => {
    // Recheck the actor inside the queue so concurrent deletion/demotion cannot retain admin rights.
    const actor = await User.findById(actorId);
    if (!actor || actor.usertype !== 'admin') throw fail(403, 'Só administradores podem gerir utilizadores.');
    return action();
  });
  userQueue = result.catch(() => {});
  return result;
}
function validateBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || !Object.keys(body).length || Object.keys(body).some(key => !['username','password','usertype'].includes(key))) throw fail(400, 'Dados de utilizador inválidos.');
}
exports.create = (actorId, body) => manage(actorId, async () => {
  validateBody(body);
  const { username, password, usertype = 'user' } = body;
  if (!validName(username) || !validPassword(password) || !roles.includes(usertype)) throw fail(400, 'Indique um nome, um perfil válido e uma password com pelo menos 8 caracteres e até 72 bytes.');
  return User.create({ username: username.trim(), password: await bcrypt.hash(password, 10), usertype });
});
exports.update = (actorId, id, body) => manage(actorId, async () => {
  validateBody(body);
  const user = await User.findById(id).select('+password');
  if (!user) throw fail(404, 'Utilizador não encontrado.');
  const { username, password, usertype } = body;
  if (username !== undefined && !validName(username)) throw fail(400, 'Nome de utilizador inválido.');
  if (usertype !== undefined && !roles.includes(usertype)) throw fail(400, 'Perfil inválido.');
  const passwordChanged = password !== undefined && password !== '';
  if (passwordChanged && !validPassword(password)) throw fail(400, 'A password deve ter pelo menos 8 caracteres e até 72 bytes.');
  if (usertype !== undefined && usertype !== user.usertype && user.usertype === 'admin') {
    if (String(actorId) === String(id)) throw fail(409, 'Não pode retirar o perfil Admin à sua própria conta.');
    if (await User.countDocuments({usertype:'admin'}) <= 1) throw fail(409, 'Tem de existir pelo menos um administrador.');
  }
  if (username !== undefined) user.username = username.trim();
  if (usertype !== undefined) user.usertype = usertype;
  if (passwordChanged) {
    user.password = await bcrypt.hash(password, 10);
    // Password resets invalidate tokens already issued for this account.
    user.tokenVersion = (user.tokenVersion || 0) + 1;
  }
  await user.save();
  return { user, passwordChanged };
});
exports.remove = (actorId, id) => manage(actorId, async () => {
  if (String(actorId) === String(id)) throw fail(409, 'Não pode eliminar a sua própria conta.');
  const user = await User.findById(id);
  if (!user) throw fail(404, 'Utilizador não encontrado.');
  if (user.usertype === 'admin' && await User.countDocuments({usertype:'admin'}) <= 1) throw fail(409, 'Tem de existir pelo menos um administrador.');
  await user.deleteOne();
});
