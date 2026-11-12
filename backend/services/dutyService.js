// Watering duties data (owner: Mahmoud)
const sql = require('../db/neon');

// to_char() sends the date as plain text "2026-11-15"
async function readAllDuties() {
  return sql`
    SELECT duties.id, duties.plot_id AS "plotId", plots.label AS "plotLabel",
           duties.assigned_user_id AS "assignedUserId", users.name AS "assigneeName",
           to_char(duties.duty_date, 'YYYY-MM-DD') AS "dutyDate", duties.status,
           duties.completed_at AS "completedAt"
    FROM duties
    JOIN plots ON plots.id = duties.plot_id
    JOIN users ON users.id = duties.assigned_user_id
    ORDER BY duties.duty_date, duties.id`;
}

async function readDutiesOfUser(userId) {
  const duties = await readAllDuties();
  return duties.filter((duty) => duty.assignedUserId === userId);
}

async function findDuty(id) {
  const duties = await readAllDuties();
  return duties.find((duty) => duty.id === id) || null;
}

async function createDuty(plotId, userId, dutyDate) {
  const rows = await sql`
    INSERT INTO duties (plot_id, assigned_user_id, duty_date)
    VALUES (${plotId}, ${userId}, ${dutyDate})
    RETURNING id`;
  return findDuty(rows[0].id);
}

async function completeDuty(id) {
  await sql`UPDATE duties SET status = 'completed', completed_at = now() WHERE id = ${id}`;
  return findDuty(id);
}

async function reassignDuty(id, userId) {
  await sql`UPDATE duties SET assigned_user_id = ${userId} WHERE id = ${id}`;
  return findDuty(id);
}

async function cancelDuty(id) {
  await sql`UPDATE duties SET status = 'cancelled' WHERE id = ${id}`;
  return findDuty(id);
}

module.exports = { readAllDuties, readDutiesOfUser, findDuty, createDuty, completeDuty, reassignDuty, cancelDuty };
