// Tools and loans data (owner: Mayan)
// A tool's status: 'damaged' if broken, 'on_loan' if someone has it, otherwise 'available'
const sql = require('../db/neon');

// ---------------- Tools ----------------
async function readTools() {
  return sql`
    SELECT tools.id, tools.name, tools.category, tools.condition,
      CASE
        WHEN tools.condition = 'damaged' THEN 'damaged'
        WHEN loans.id IS NOT NULL THEN 'on_loan'
        ELSE 'available'
      END AS status
    FROM tools
    LEFT JOIN loans ON loans.tool_id = tools.id AND loans.status = 'on_loan'
    ORDER BY tools.name`;
}

async function findTool(id) {
  const tools = await readTools();
  return tools.find((tool) => tool.id === id) || null;
}

async function createTool(name, category, condition) {
  const rows = await sql`
    INSERT INTO tools (name, category, condition)
    VALUES (${name}, ${category}, ${condition})
    RETURNING id`;
  return findTool(rows[0].id);
}

async function updateTool(id, name, category, condition) {
  await sql`
    UPDATE tools SET name = ${name}, category = ${category}, condition = ${condition}
    WHERE id = ${id}`;
  return findTool(id);
}

async function setCondition(id, condition) {
  await sql`UPDATE tools SET condition = ${condition} WHERE id = ${id}`;
}

// ---------------- Loans ----------------
// The JOINs add the tool name and the borrower's name for the frontend
async function readAllLoans() {
  return sql`
    SELECT loans.id, loans.tool_id AS "toolId", tools.name AS "toolName", tools.category,
           loans.user_id AS "userId", users.name AS "userName", loans.status,
           loans.checkout_date AS "checkoutDate", loans.return_date AS "returnDate",
           loans.return_condition AS "returnCondition"
    FROM loans
    JOIN tools ON tools.id = loans.tool_id
    JOIN users ON users.id = loans.user_id
    ORDER BY loans.id DESC`;
}

async function readLoansOfUser(userId) {
  const loans = await readAllLoans();
  return loans.filter((loan) => loan.userId === userId);
}

async function findLoan(id) {
  const loans = await readAllLoans();
  return loans.find((loan) => loan.id === id) || null;
}

async function createLoan(toolId, userId) {
  const rows = await sql`
    INSERT INTO loans (tool_id, user_id) VALUES (${toolId}, ${userId})
    RETURNING id`;
  return findLoan(rows[0].id);
}

async function returnLoan(loanId, condition) {
  await sql`
    UPDATE loans SET status = 'returned', return_date = now(), return_condition = ${condition}
    WHERE id = ${loanId}`;
  return findLoan(loanId);
}

module.exports = {
  readTools, findTool, createTool, updateTool, setCondition,
  readAllLoans, readLoansOfUser, findLoan, createLoan, returnLoan
};
