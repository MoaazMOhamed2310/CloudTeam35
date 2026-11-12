const express = require('express');
const dutiesController = require('../controllers/duties');
const { requireLogin, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireLogin, dutiesController.listDuties);
router.get('/forecast', requireLogin, dutiesController.getForecast);
router.post('/', requireLogin, requireAdmin, dutiesController.createDuty);
router.patch('/:id/complete', requireLogin, dutiesController.completeDuty);
router.patch('/:id', requireLogin, requireAdmin, dutiesController.changeDuty);

module.exports = router;
