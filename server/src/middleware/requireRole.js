// Authorize against the current database role, never a role supplied by the browser.
module.exports = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.usertype)) return res.status(403).json({ message: 'Forbidden' });
  next();
};

