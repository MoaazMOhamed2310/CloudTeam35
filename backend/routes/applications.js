const express = require('express');
const applicationsController = require('../controllers/applications');
const verifyTurnstile = require('../middleware/turnstile');
const { requireLogin, requireAdmin, requireResident } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireLogin, applicationsController.listApplications);
router.post('/', requireLogin, requireResident, verifyTurnstile, applicationsController.createApplication);
router.patch('/:id/assign', requireLogin, requireAdmin, applicationsController.assignPlot);
router.patch('/:id/reject', requireLogin, requireAdmin, applicationsController.rejectApplication);
router.patch('/:id/withdraw', requireLogin, requireResident, applicationsController.withdrawApplication);

module.exports = router;
