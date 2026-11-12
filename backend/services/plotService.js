// Plots and applications data (owner: Moaaz)
const sql = require('../db/neon');

// ---------------- Plots ----------------
async function readPlots() {
  return sql`SELECT id, label, size, location, status FROM plots ORDER BY label`;
}

async function readPlotsByStatus(status) {
  return sql`SELECT id, label, size, location, status FROM plots WHERE status = ${status} ORDER BY label`;
}

async function findPlot(id) {
  const rows = await sql`SELECT id, label, size, location, status FROM plots WHERE id = ${id}`;
  return rows[0] || null;
}

async function updatePlotStatus(id, status) {
  const rows = await sql`
    UPDATE plots SET status = ${status} WHERE id = ${id}
    RETURNING id, label, size, location, status`;
  return rows[0] || null;
}

// ---------------- Applications ----------------
// The JOINs add the resident's name and the plot label for the frontend
async function readAllApplications() {
  return sql`
    SELECT applications.id, applications.user_id AS "userId", users.name AS "userName",
           applications.season, applications.note, applications.status,
           applications.assigned_plot_id AS "assignedPlotId", plots.label AS "plotLabel",
           applications.created_at AS "createdAt"
    FROM applications
    JOIN users ON users.id = applications.user_id
    LEFT JOIN plots ON plots.id = applications.assigned_plot_id
    ORDER BY applications.id DESC`;
}

async function readApplicationsOfUser(userId) {
  return sql`
    SELECT applications.id, applications.user_id AS "userId", users.name AS "userName",
           applications.season, applications.note, applications.status,
           applications.assigned_plot_id AS "assignedPlotId", plots.label AS "plotLabel",
           applications.created_at AS "createdAt"
    FROM applications
    JOIN users ON users.id = applications.user_id
    LEFT JOIN plots ON plots.id = applications.assigned_plot_id
    WHERE applications.user_id = ${userId}
    ORDER BY applications.id DESC`;
}

async function findApplication(id) {
  const rows = await sql`
    SELECT applications.id, applications.user_id AS "userId", users.name AS "userName",
           applications.season, applications.note, applications.status,
           applications.assigned_plot_id AS "assignedPlotId", plots.label AS "plotLabel",
           applications.created_at AS "createdAt"
    FROM applications
    JOIN users ON users.id = applications.user_id
    LEFT JOIN plots ON plots.id = applications.assigned_plot_id
    WHERE applications.id = ${id}`;
  return rows[0] || null;
}

// Does this resident already have a pending or approved application for this season?
async function hasActiveApplication(userId, season) {
  const rows = await sql`
    SELECT id FROM applications
    WHERE user_id = ${userId} AND season = ${season} AND status IN ('pending', 'approved')`;
  return rows.length > 0;
}

async function createApplication(userId, season, note) {
  const rows = await sql`
    INSERT INTO applications (user_id, season, note)
    VALUES (${userId}, ${season}, ${note})
    RETURNING id`;
  return findApplication(rows[0].id);
}

// Approve: the application gets the plot, and the plot becomes assigned
async function approveApplication(applicationId, plotId) {
  await sql`UPDATE applications SET status = 'approved', assigned_plot_id = ${plotId} WHERE id = ${applicationId}`;
  await sql`UPDATE plots SET status = 'assigned' WHERE id = ${plotId}`;
  return findApplication(applicationId);
}

async function setApplicationStatus(applicationId, status) {
  await sql`UPDATE applications SET status = ${status} WHERE id = ${applicationId}`;
  return findApplication(applicationId);
}

module.exports = {
  readPlots, readPlotsByStatus, findPlot, updatePlotStatus,
  readAllApplications, readApplicationsOfUser, findApplication,
  hasActiveApplication, createApplication, approveApplication, setApplicationStatus
};
