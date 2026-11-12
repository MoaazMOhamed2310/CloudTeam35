const express = require('express');
const toolsController = require('../controllers/tools');
const { requireLogin, requireAdmin, requireResident } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireLogin, toolsController.listTools);
router.post('/', requireLogin, requireAdmin, toolsController.createTool);
router.patch('/:id', requireLogin, requireAdmin, toolsController.updateTool);
router.post('/:id/checkout', requireLogin, requireResident, toolsController.checkoutTool);
router.post('/:id/report', requireLogin, requireResident, toolsController.reportDamage);

module.exports = router;
