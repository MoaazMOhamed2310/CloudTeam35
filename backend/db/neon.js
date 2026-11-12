// The connection to Neon Postgres (Lab 5)
// Every service uses:  const sql = require('../db/neon');
// sql`...${value}...` sends each value as a separate parameter, so it is safe from SQL injection.
const { neon } = require('@neondatabase/serverless');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is missing. Add it to backend/.env');
}

const sql = neon(process.env.DATABASE_URL || 'postgresql://missing:missing@localhost/missing');

module.exports = sql;
