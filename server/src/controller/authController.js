const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/models');
const { generateToken } = require('../utilities/jwtUtils');
const publicUser = user => ({ id: String(user._id), username: user.username, usertype: user.usertype });
const users = require('../services/userService');
const fail = (res, error) => res.status(error.status || (error.code === 11000 ? 409 : error.name === 'ValidationError' ? 400 : 500)).json({ message: error.status ? error.message : error.code === 11000 ? 'Este nome de utilizador já existe.' : 'Não foi possível guardar o utilizador.' });
exports.listUsers = async (req, res) => {
  try { res.json((await User.find().select('_id username usertype').sort({username:1})).map(publicUser)); }
  catch { res.status(500).json({ message: 'Não foi possível consultar os utilizadores.' }); }
};
exports.registerUser = async (req, res) => {
  try { const user = await users.create(req.user._id, req.body); res.status(201).json({ message: 'Utilizador criado.', ...publicUser(user) }); }
  catch (error) { fail(res, error); }
};
exports.editUser = async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return res.status(400).json({ message: 'ID de utilizador inválido.' });
  try { const {user,passwordChanged} = await users.update(req.user._id,req.params.id,req.body); res.json({ message: 'Utilizador atualizado.', ...publicUser(user), passwordChanged }); }
  catch (error) { fail(res, error); }
};
exports.deleteUser = async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return res.status(400).json({ message: 'ID de utilizador inválido.' });
  try { await users.remove(req.user._id,req.params.id); res.json({ message: 'Utilizador eliminado.' }); }
  catch (error) { fail(res, error); }
};
exports.loginUser = async (req, res) => {
  const { username, password } = req.body;
  if (typeof username !== 'string' || typeof password !== 'string' || Buffer.byteLength(password) > 72) return res.status(400).json({ message: 'Invalid credentials' });
  try {
    const user = await User.findOne({ username: username.trim() }).select('+password');
    if (!user || !await bcrypt.compare(password, user.password)) return res.status(401).json({ message: 'Invalid credentials' });
    res.json({ message: 'User logged successfully', ...publicUser(user), token: generateToken(user) });
  } catch { res.status(500).json({ message: 'Unable to log in' }); }
};
// JWT logout removes the browser session; existing tokens expire after 24 hours.
exports.logoutUser = (req, res) => res.json({ message: 'User logged out successfully' });

