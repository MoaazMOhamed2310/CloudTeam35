const express = require('express');
const loansController = require('../controllers/loans');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireLogin, loansController.listLoans);
router.patch('/:id/return', requireLogin, loansController.returnTool);

module.exports = router;
