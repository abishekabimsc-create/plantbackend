const express = require('express');
const rateLimit = require('express-rate-limit');
const { login, me } = require('../controllers/authController');
const { validateLogin } = require('../middleware/validate');
const { requireAdmin } = require('../middleware/auth');

const { isProduction } = require('../config/env');

const router = express.Router();

/**
 * Slows down credential stuffing without locking out a forgetful admin.
 *
 * The ceiling is deliberately generous in development: repeatedly signing in
 * while building or testing is normal there, and being locked out for ten
 * minutes over it is a worse outcome than the risk it guards against.
 */
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: isProduction ? 10 : 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many sign-in attempts. Wait 10 minutes and try again.',
  },
});

router.post('/login', loginLimiter, validateLogin, login);
router.get('/me', requireAdmin, me);

module.exports = router;
