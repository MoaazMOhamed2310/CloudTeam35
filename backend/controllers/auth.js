// Register and sign in (owner: Moaaz)
// POST /api/auth/register  { name, email, password }  -> 201 { token, user }
// POST /api/auth/login     { email, password }        -> 200 { token, user }
const jwt = require('jsonwebtoken');
const authService = require('../services/authService');
const auditService = require('../services/auditService');
const { sendError, checkText } = require('../utils/helpers');

// The token says who the user is. It is signed with JWT_SECRET and expires after 2 hours.
function createToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '2h' }
  );
}

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body || {};

    const problem = checkText(name, 'Name', 1, 80) || checkText(email, 'Email', 3, 120) || checkText(password, 'Password', 8, 72);
    if (problem) {
      return sendError(res, 400, 'VALIDATION_ERROR', problem);
    }
    if (!email.includes('@')) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Email must be a valid email address.');
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await authService.findUserByEmail(cleanEmail);
    if (existing) {
      return sendError(res, 409, 'EMAIL_TAKEN', 'An account with this email already exists.');
    }

    // The role is never read from the request: new accounts are always residents
    const user = await authService.createUser(name.trim(), cleanEmail, password);
    await auditService.addLog(user.id, 'register', 'Created a resident account');

    res.status(201).json({ token: createToken(user), user });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};

    if (typeof email !== 'string' || typeof password !== 'string') {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Email and password are required.');
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await authService.findUserByEmail(cleanEmail);
    const passwordOk = user ? await authService.checkPassword(password, user.password_hash) : false;

    if (!passwordOk) {
      await auditService.addLog(null, 'login.failed', `Failed sign-in for ${cleanEmail}`);
      // Same message for a wrong email and a wrong password, so nobody can find out which emails exist
      return sendError(res, 401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
    }

    await auditService.addLog(user.id, 'login', 'Signed in');
    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };   // never send the hash
    res.status(200).json({ token: createToken(safeUser), user: safeUser });
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login };
