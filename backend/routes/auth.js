const express = require('express');
const authController = require('../controllers/auth');
const verifyTurnstile = require('../middleware/turnstile');

const router = express.Router();

router.post('/register', verifyTurnstile, authController.register);
router.post('/login', authController.login);

module.exports = router;
