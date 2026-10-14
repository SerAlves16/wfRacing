const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/models');
const secret = require('../middleware/jwtSecrets');
// Only identity belongs in a signed token; passwords and user documents stay in MongoDB.
const generateToken = (user, callback) => {
  const token = jwt.sign({}, secret, { subject: String(user._id), expiresIn: '24h', issuer: 'wfr-racetech', audience: 'wfr-client' });
  return callback ? callback(token) : token;
};
const validateToken = async (token, callback) => {
  try {
    const decoded = jwt.verify((token || '').replace(/^Bearer /, ''), secret, { issuer: 'wfr-racetech', audience: 'wfr-client' });
    const user = await User.findById(decoded.sub).select('-password');
    return callback(Boolean(user), user);
  } catch { return callback(false, null); }
};
module.exports = { generateToken, validateToken, hashPassword: password => bcrypt.hash(password, 10), secret };

