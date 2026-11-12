// GET /api/users?role=resident   admin only: residents to choose from when creating duties
const express = require('express');
const authService = require('../services/authService');
const { requireLogin, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireLogin, requireAdmin, async (req, res, next) => {
  try {
    const residents = await authService.listResidents();
    res.status(200).json(residents);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
