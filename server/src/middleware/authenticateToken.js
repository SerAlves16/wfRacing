const { validateToken } = require('../utilities/jwtUtils');
module.exports = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token || !token.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });
  return validateToken(token, (valid, user) => {
    if (!valid) return res.status(401).json({ message: 'Unauthorized' });
    req.user = user;
    next();
  });
};

