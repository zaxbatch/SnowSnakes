// Like `auth`, but a missing or unusable token is not an error: the request
// continues with req.user left undefined. Used by endpoints that behave
// slightly differently for signed-in visitors but are open to everyone, such as
// sharing (anyone can share a link) and the game gallery's "did I like this".
const User = require('../models/User');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();

  const token = authHeader.split(' ')[1];
  if (!token) return next();

  const decoded = User.verifyToken(token);
  if (decoded) req.user = decoded;
  next();
};
