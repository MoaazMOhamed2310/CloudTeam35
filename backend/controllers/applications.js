// Plot applications (owner: Moaaz)
// GET   /api/applications                own (resident) or all (admin)
// POST  /api/applications                { season, note }   (resident, + Turnstile)
// PATCH /api/applications/:id/assign     { plotId }         (admin)
// PATCH /api/applications/:id/reject                        (admin)
// PATCH /api/applications/:id/withdraw                      (resident, own only)
const plotService = require('../services/plotService');
const auditService = require('../services/auditService');
const { sendError, checkText, toId } = require('../utils/helpers');

const seasons = new Set(['Winter 2026', 'Spring 2027', 'Summer 2027', 'Autumn 2027']);

async function listApplications(req, res, next) {
  try {
    // Residents only see their own applications. Admins see everyone's.
    if (req.user.role === 'admin') {
      return res.status(200).json(await plotService.readAllApplications());
    }
    res.status(200).json(await plotService.readApplicationsOfUser(req.user.id));
  } catch (error) {
    next(error);
  }
}

async function createApplication(req, res, next) {
  try {
    const { season, note } = req.body || {};

    if (!seasons.has(season)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Please choose one of the listed seasons.');
    }
    const cleanNote = typeof note === 'string' ? note.trim() : '';
    if (cleanNote.length > 300) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'The note must be at most 300 characters.');
    }

    const alreadyApplied = await plotService.hasActiveApplication(req.user.id, season);
    if (alreadyApplied) {
      return sendError(res, 409, 'ALREADY_APPLIED', `You already have an active application for ${season}.`);
    }

    const application = await plotService.createApplication(req.user.id, season, cleanNote);
    await auditService.addLog(req.user.id, 'application.create', `Applied for ${season}`);
    res.status(201).json(application);
  } catch (error) {
    next(error);
  }
}

async function assignPlot(req, res, next) {
  try {
    const applicationId = toId(req.params.id);
    const plotId = toId((req.body || {}).plotId);

    if (!plotId) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Please choose a plot.');
    }

    const application = applicationId ? await plotService.findApplication(applicationId) : null;
    if (!application) {
      return sendError(res, 404, 'APPLICATION_NOT_FOUND', 'Application not found.');
    }
    if (application.status !== 'pending') {
      return sendError(res, 409, 'NOT_PENDING', 'Only pending applications can be approved.');
    }

    const plot = await plotService.findPlot(plotId);
    if (!plot) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'That plot does not exist.');
    }
    if (plot.status !== 'available') {
      return sendError(res, 409, 'PLOT_NOT_AVAILABLE', `Plot ${plot.label} is not available.`);
    }

    const updated = await plotService.approveApplication(applicationId, plotId);
    await auditService.addLog(req.user.id, 'application.assign', `Assigned plot ${plot.label} to ${application.userName}`);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
}

async function rejectApplication(req, res, next) {
  try {
    const applicationId = toId(req.params.id);
    const application = applicationId ? await plotService.findApplication(applicationId) : null;

    if (!application) {
      return sendError(res, 404, 'APPLICATION_NOT_FOUND', 'Application not found.');
    }
    if (application.status !== 'pending') {
      return sendError(res, 409, 'NOT_PENDING', 'Only pending applications can be rejected.');
    }

    const updated = await plotService.setApplicationStatus(applicationId, 'rejected');
    await auditService.addLog(req.user.id, 'application.reject', `Rejected application from ${application.userName}`);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
}

async function withdrawApplication(req, res, next) {
  try {
    const applicationId = toId(req.params.id);
    const application = applicationId ? await plotService.findApplication(applicationId) : null;

    // Someone else's application answers 404, so residents cannot see other people's records
    if (!application || application.userId !== req.user.id) {
      return sendError(res, 404, 'APPLICATION_NOT_FOUND', 'Application not found.');
    }
    if (application.status !== 'pending') {
      return sendError(res, 409, 'NOT_PENDING', 'Only pending applications can be withdrawn.');
    }

    const updated = await plotService.setApplicationStatus(applicationId, 'withdrawn');
    await auditService.addLog(req.user.id, 'application.withdraw', `Withdrew application for ${application.season}`);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
}

module.exports = { listApplications, createApplication, assignPlot, rejectApplication, withdrawApplication };
