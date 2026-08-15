const User = require('../models/User');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  const decoded = User.verifyToken(token);
  if (!decoded) return res.status(401).json({ error: 'Invalid token' });
  req.user = decoded; // { id, username }
  next();
};