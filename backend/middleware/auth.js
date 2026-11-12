// Check the login token and the role (owner: Moaaz)
// Hiding a button in the frontend is not access control. These checks are.
const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/helpers');

// 401 unless the request has "Authorization: Bearer <token>" with a valid token
function requireLogin(req, res, next) {
  const header = req.get('Authorization') || '';
  const token = header.replace('Bearer ', '');

  if (!token) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Please sign in.');
  }

  try {
    // verify() checks the signature and the expiry date
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    req.user = { id: payload.id, name: payload.name, role: payload.role };
    next();
  } catch (error) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Your session has expired. Please sign in again.');
  }
}

// 403 unless the signed-in user is an admin (use after requireLogin)
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return sendError(res, 403, 'FORBIDDEN', 'Only admins can do this.');
  }
  next();
}

// 403 unless the signed-in user is a resident (use after requireLogin)
function requireResident(req, res, next) {
  if (req.user.role !== 'resident') {
    return sendError(res, 403, 'FORBIDDEN', 'Only residents can do this.');
  }
  next();
}

module.exports = { requireLogin, requireAdmin, requireResident };
