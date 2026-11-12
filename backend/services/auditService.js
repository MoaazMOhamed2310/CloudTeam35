// Audit log: who did what and when (owner: Mahmoud)
// Never write passwords or tokens in the log.
const sql = require('../db/neon');

async function addLog(userId, action, details) {
  await sql`
    INSERT INTO audit_logs (user_id, action, details)
    VALUES (${userId}, ${action}, ${details})`;
}

async function readLogs() {
  return sql`
    SELECT audit_logs.id, audit_logs.action, audit_logs.details, audit_logs.created_at AS "timestamp",
           COALESCE(users.name, 'Anonymous') AS "userName"
    FROM audit_logs
    LEFT JOIN users ON users.id = audit_logs.user_id
    ORDER BY audit_logs.id DESC
    LIMIT 300`;
}

module.exports = { addLog, readLogs };
