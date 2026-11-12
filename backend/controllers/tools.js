// Shared tools (owner: Mayan)
// GET   /api/tools                   list tools with availability
// POST  /api/tools                   { name, category, condition }   (admin)
// PATCH /api/tools/:id               { name, category, condition }   (admin)
// POST  /api/tools/:id/checkout      borrow a tool                   (resident)
// POST  /api/tools/:id/report        report the tool as damaged      (the borrower)
const toolService = require('../services/toolService');
const auditService = require('../services/auditService');
const { sendError, checkText, toId } = require('../utils/helpers');

const conditions = new Set(['good', 'fair', 'damaged']);

function validateTool(name, category, condition) {
  const textProblem = checkText(name, 'Name', 1, 80) || checkText(category, 'Category', 1, 40);
  if (textProblem) return textProblem;
  if (!conditions.has(condition)) {
    return 'Condition must be good, fair or damaged.';
  }
  return null;
}

async function listTools(req, res, next) {
  try {
    res.status(200).json(await toolService.readTools());
  } catch (error) {
    next(error);
  }
}

async function createTool(req, res, next) {
  try {
    const { name, category, condition } = req.body || {};
    const problem = validateTool(name, category, condition);
    if (problem) {
      return sendError(res, 400, 'VALIDATION_ERROR', problem);
    }

    const tool = await toolService.createTool(name.trim(), category.trim(), condition);
    await auditService.addLog(req.user.id, 'tool.create', `Added ${tool.name}`);
    res.status(201).json(tool);
  } catch (error) {
    next(error);
  }
}

async function updateTool(req, res, next) {
  try {
    const { name, category, condition } = req.body || {};
    const problem = validateTool(name, category, condition);
    if (problem) {
      return sendError(res, 400, 'VALIDATION_ERROR', problem);
    }

    const toolId = toId(req.params.id);
    const existing = toolId ? await toolService.findTool(toolId) : null;
    if (!existing) {
      return sendError(res, 404, 'TOOL_NOT_FOUND', 'Tool not found.');
    }

    const tool = await toolService.updateTool(toolId, name.trim(), category.trim(), condition);
    await auditService.addLog(req.user.id, 'tool.update', `Updated ${tool.name}`);
    res.status(200).json(tool);
  } catch (error) {
    next(error);
  }
}

async function checkoutTool(req, res, next) {
  try {
    const toolId = toId(req.params.id);
    const tool = toolId ? await toolService.findTool(toolId) : null;

    if (!tool) {
      return sendError(res, 404, 'TOOL_NOT_FOUND', 'Tool not found.');
    }
    if (tool.status !== 'available') {
      return sendError(res, 409, 'TOOL_NOT_AVAILABLE', `${tool.name} is not available right now.`);
    }

    const loan = await toolService.createLoan(toolId, req.user.id);
    await auditService.addLog(req.user.id, 'tool.checkout', `Borrowed ${tool.name}`);
    res.status(201).json(loan);
  } catch (error) {
    next(error);
  }
}

async function reportDamage(req, res, next) {
  try {
    const toolId = toId(req.params.id);
    const tool = toolId ? await toolService.findTool(toolId) : null;
    if (!tool) {
      return sendError(res, 404, 'TOOL_NOT_FOUND', 'Tool not found.');
    }

    // Only the person who has the tool right now can report it
    const myLoans = await toolService.readLoansOfUser(req.user.id);
    const hasIt = myLoans.some((loan) => loan.toolId === toolId && loan.status === 'on_loan');
    if (!hasIt) {
      return sendError(res, 403, 'FORBIDDEN', 'You can only report a tool you have borrowed.');
    }

    await toolService.setCondition(toolId, 'damaged');
    await auditService.addLog(req.user.id, 'tool.report', `Reported ${tool.name} as damaged`);
    res.status(200).json(await toolService.findTool(toolId));
  } catch (error) {
    next(error);
  }
}

module.exports = { listTools, createTool, updateTool, checkoutTool, reportDamage };
