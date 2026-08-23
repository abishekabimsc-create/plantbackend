const express = require('express');
const rateLimit = require('express-rate-limit');
const { submitContact, listContacts, markHandled } = require('../controllers/contactController');
const { validateContact } = require('../middleware/validate');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Keeps the public form from being used as a spam relay.
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
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
