const express = require('express');
const plotsController = require('../controllers/plots');
const { requireLogin, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireLogin, plotsController.listPlots);
router.patch('/:id/status', requireLogin, requireAdmin, plotsController.updatePlotStatus);

module.exports = router;
