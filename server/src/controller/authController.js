const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/models');
const { generateToken } = require('../utilities/jwtUtils');
const publicUser = user => ({ id: String(user._id), username: user.username, usertype: user.usertype });
const credentialsValid = (username, password) => typeof username === 'string' && username.trim().length >= 1 && username.length <= 100 && typeof password === 'string' && password.length >= 8 && Buffer.byteLength(password) <= 72;
const fail = (res, error) => res.status(error.code === 11000 ? 409 : error.name === 'ValidationError' ? 400 : 500).json({ message: error.code === 11000 ? 'Username already exists' : 'Unable to save user' });
exports.registerUser = async (req, res) => {
  const { username, password, usertype = 'user' } = req.body;
  if (!credentialsValid(username, password) || !['admin', 'operator', 'user'].includes(usertype)) return res.status(400).json({ message: 'Invalid credentials or role; password must have 8 characters and at most 72 bytes' });
  try {
    const user = await User.create({ username: username.trim(), password: await bcrypt.hash(password, 10), usertype });
    res.status(201).json({ message: 'User registered successfully', ...publicUser(user) });
  } catch (error) { fail(res, error); }
};
exports.editUser = async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return res.status(400).json({ message: 'Invalid user ID' });
  const { username, password } = req.body;
  if (!credentialsValid(username, password)) return res.status(400).json({ message: 'Invalid credentials' });
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.username = username.trim(); user.password = await bcrypt.hash(password, 10);
    await user.save();
    res.json({ message: 'User updated successfully', ...publicUser(user) });
  } catch (error) { fail(res, error); }
};
exports.deleteUser = async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return res.status(400).json({ message: 'Invalid user ID' });
  if (String(req.user._id) === req.params.id) return res.status(400).json({ message: 'Cannot delete your own account' });
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) { fail(res, error); }
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

