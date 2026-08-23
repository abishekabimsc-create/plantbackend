const express = require('express');
const rateLimit = require('express-rate-limit');
const { submitContact, listContacts, markHandled } = require('../controllers/contactController');
const { validateContact } = require('../middleware/validate');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

const { isProduction } = require('../config/env');

/**
 * Keeps the public form from being used as a spam relay.
 *
 * Generous in development for the same reason as the sign-in limiter:
 * submitting the form repeatedly while building is normal, and being locked
 * out for fifteen minutes over it is worse than the risk it guards against.
 */
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isProduction ? 8 : 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'You have sent several messages already. Please try again a little later.',
  },
});

router.post('/', contactLimiter, validateContact, submitContact);
router.get('/', requireAdmin, listContacts);
router.patch('/:id/handled', requireAdmin, markHandled);

module.exports = router;
