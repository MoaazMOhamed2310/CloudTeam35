// Plots (owner: Moaaz)
// GET   /api/plots?status=available     list plots, optional filter
// PATCH /api/plots/:id/status           { status }   (admin)
const plotService = require('../services/plotService');
const auditService = require('../services/auditService');
const { sendError, toId } = require('../utils/helpers');

const plotStatuses = new Set(['available', 'assigned', 'maintenance']);

async function listPlots(req, res, next) {
  try {
    const status = req.query.status;

    if (!status) {
      return res.status(200).json(await plotService.readPlots());
    }
    if (!plotStatuses.has(status)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Status must be available, assigned or maintenance.');
    }
    res.status(200).json(await plotService.readPlotsByStatus(status));
  } catch (error) {
    next(error);
  }
}

async function updatePlotStatus(req, res, next) {
  try {
    const { status } = req.body || {};
    if (!plotStatuses.has(status)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Status must be available, assigned or maintenance.');
    }

    const plotId = toId(req.params.id);
    const plot = plotId ? await plotService.updatePlotStatus(plotId, status) : null;
    if (!plot) {
      return sendError(res, 404, 'PLOT_NOT_FOUND', 'Plot not found.');
    }

    await auditService.addLog(req.user.id, 'plot.status', `${plot.label} set to ${status}`);
    res.status(200).json(plot);
  } catch (error) {
    next(error);
  }
}

module.exports = { listPlots, updatePlotStatus };
