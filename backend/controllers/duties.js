// Watering duties (owner: Mahmoud)
// GET   /api/duties                  own (resident) or all (admin), with rainExpected
// GET   /api/duties/forecast?date=   weather from Open-Meteo (502 if it is down)
// POST  /api/duties                  { plotId, assignedUserId, dutyDate }   (admin)
// PATCH /api/duties/:id              { assignedUserId } or { status: 'cancelled' }   (admin)
// PATCH /api/duties/:id/complete     the assigned resident or an admin
const dutyService = require('../services/dutyService');
const plotService = require('../services/plotService');
const authService = require('../services/authService');
const weatherService = require('../services/weatherService');
const auditService = require('../services/auditService');
const { sendError, toId } = require('../utils/helpers');

// Today's date as "2026-11-12"
function todayText() {
  return new Date().toISOString().slice(0, 10);
}

// Add rainExpected to each duty. If the weather service is down, duties still load.
async function addRainInfo(duties) {
  let rainyDates = [];
  try {
    const days = await weatherService.getForecast();
    rainyDates = days.filter((day) => day.rainExpected).map((day) => day.date);
  } catch (error) {
    console.warn('Forecast unavailable:', error.message);
  }
  return duties.map((duty) => ({ ...duty, rainExpected: rainyDates.includes(duty.dutyDate) }));
}

async function listDuties(req, res, next) {
  try {
    let duties;
    if (req.user.role === 'admin') {
      duties = await dutyService.readAllDuties();
    } else {
      duties = await dutyService.readDutiesOfUser(req.user.id);
    }
    res.status(200).json(await addRainInfo(duties));
  } catch (error) {
    next(error);
  }
}

async function getForecast(req, res, next) {
  try {
    let days;
    try {
      days = await weatherService.getForecast();
    } catch (error) {
      console.warn('Forecast unavailable:', error.message);
      return sendError(res, 502, 'WEATHER_UNAVAILABLE', 'The weather service is not responding. Try again later.');
    }

    const date = req.query.date;
    if (!date) {
      return res.status(200).json(days);
    }
    const day = days.find((d) => d.date === date);
    if (!day) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Forecast is only available for the next 7 days.');
    }
    res.status(200).json(day);
  } catch (error) {
    next(error);
  }
}

async function createDuty(req, res, next) {
  try {
    const { plotId, assignedUserId, dutyDate } = req.body || {};

    if (!toId(plotId) || !toId(assignedUserId)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Please choose a plot and a resident.');
    }
    if (typeof dutyDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dutyDate)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'The date must look like 2026-12-01.');
    }
    if (dutyDate < todayText()) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'The date cannot be in the past.');
    }

    const plot = await plotService.findPlot(plotId);
    if (!plot) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'That plot does not exist.');
    }
    const resident = await authService.findUserById(assignedUserId);
    if (!resident || resident.role !== 'resident') {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Duties can only be given to residents.');
    }

    const duty = await dutyService.createDuty(plotId, assignedUserId, dutyDate);
    await auditService.addLog(req.user.id, 'duty.create', `Water plot ${plot.label} on ${dutyDate} given to ${resident.name}`);
    const [withRain] = await addRainInfo([duty]);
    res.status(201).json(withRain);
  } catch (error) {
    next(error);
  }
}

async function completeDuty(req, res, next) {
  try {
    const dutyId = toId(req.params.id);
    const duty = dutyId ? await dutyService.findDuty(dutyId) : null;

    // Only the assigned resident or an admin (someone else's duty answers 404)
    if (!duty || (req.user.role !== 'admin' && duty.assignedUserId !== req.user.id)) {
      return sendError(res, 404, 'DUTY_NOT_FOUND', 'Duty not found.');
    }
    if (duty.status !== 'pending') {
      return sendError(res, 409, 'NOT_PENDING', `This duty is already ${duty.status}.`);
    }

    const updated = await dutyService.completeDuty(dutyId);
    await auditService.addLog(req.user.id, 'duty.complete', `Water plot ${duty.plotLabel} on ${duty.dutyDate} done`);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
}

async function changeDuty(req, res, next) {
  try {
    const { assignedUserId, status } = req.body || {};
    const dutyId = toId(req.params.id);
    const duty = dutyId ? await dutyService.findDuty(dutyId) : null;

    if (!duty) {
      return sendError(res, 404, 'DUTY_NOT_FOUND', 'Duty not found.');
    }
    if (duty.status !== 'pending') {
      return sendError(res, 409, 'NOT_PENDING', 'Only pending duties can be changed.');
    }

    let updated;
    if (status === 'cancelled') {
      updated = await dutyService.cancelDuty(dutyId);
      await auditService.addLog(req.user.id, 'duty.cancel', `Cancelled watering of ${duty.plotLabel} on ${duty.dutyDate}`);
    } else if (toId(assignedUserId)) {
      const resident = await authService.findUserById(assignedUserId);
      if (!resident || resident.role !== 'resident') {
        return sendError(res, 400, 'VALIDATION_ERROR', 'Duties can only be given to residents.');
      }
      updated = await dutyService.reassignDuty(dutyId, assignedUserId);
      await auditService.addLog(req.user.id, 'duty.reassign', `Watering of ${duty.plotLabel} given to ${resident.name}`);
    } else {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Send assignedUserId to reassign, or status "cancelled" to cancel.');
    }

    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
}

module.exports = { listDuties, getForecast, createDuty, completeDuty, changeDuty };
