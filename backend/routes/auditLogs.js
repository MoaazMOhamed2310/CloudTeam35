// GET /api/audit-logs   admin only (owner: Mahmoud)
const express = require('express');
const auditService = require('../services/auditService');
const { requireLogin, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireLogin, requireAdmin, async (req, res, next) => {
  try {
    res.status(200).json(await auditService.readLogs());
  } catch (error) {
    next(error);
  }
});

module.exports = router;
