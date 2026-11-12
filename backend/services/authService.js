// Users and passwords (owner: Moaaz)
// Passwords are never stored. Only the bcrypt hash is stored.
const bcrypt = require('bcryptjs');
const sql = require('../db/neon');

async function findUserByEmail(email) {
  const rows = await sql`SELECT id, name, email, role, password_hash FROM users WHERE email = ${email}`;
  return rows[0] || null;
}

async function findUserById(id) {
  const rows = await sql`SELECT id, name, email, role FROM users WHERE id = ${id}`;
  return rows[0] || null;
}

// New accounts are always residents
async function createUser(name, email, password, role = 'resident') {
  const passwordHash = await bcrypt.hash(password, 10);
  const rows = await sql`
    INSERT INTO users (name, email, password_hash, role)
    VALUES (${name}, ${email}, ${passwordHash}, ${role})
    RETURNING id, name, email, role`;
  return rows[0];
}

async function checkPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

async function listResidents() {
  return sql`SELECT id, name, email, role FROM users WHERE role = 'resident' ORDER BY name`;
}

module.exports = { findUserByEmail, findUserById, createUser, checkPassword, listResidents };
