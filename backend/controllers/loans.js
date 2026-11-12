// Tool loans (owner: Mayan)
// GET   /api/loans              own loans (resident) or all (admin)
// PATCH /api/loans/:id/return   { condition }   the borrower or an admin
const toolService = require('../services/toolService');
const auditService = require('../services/auditService');
const { sendError, toId } = require('../utils/helpers');

const conditions = new Set(['good', 'fair', 'damaged']);

async function listLoans(req, res, next) {
  try {
    if (req.user.role === 'admin') {
      return res.status(200).json(await toolService.readAllLoans());
    }
    res.status(200).json(await toolService.readLoansOfUser(req.user.id));
  } catch (error) {
    next(error);
  }
}

async function returnTool(req, res, next) {
  try {
    const { condition } = req.body || {};
    if (!conditions.has(condition)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Condition must be good, fair or damaged.');
    }

    const loanId = toId(req.params.id);
    const loan = loanId ? await toolService.findLoan(loanId) : null;

    // A resident can only return their own loan (someone else's answers 404)
    if (!loan || (req.user.role !== 'admin' && loan.userId !== req.user.id)) {
      return sendError(res, 404, 'LOAN_NOT_FOUND', 'Loan not found.');
    }
    if (loan.status !== 'on_loan') {
      return sendError(res, 409, 'ALREADY_RETURNED', 'This tool has already been returned.');
    }

    const updated = await toolService.returnLoan(loanId, condition);
    await toolService.setCondition(loan.toolId, condition);
    await auditService.addLog(req.user.id, 'loan.return', `Returned ${loan.toolName} (${condition})`);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
}

module.exports = { listLoans, returnTool };
