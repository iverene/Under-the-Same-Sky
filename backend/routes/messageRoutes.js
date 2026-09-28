const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const MessageController = require('../controllers/messageController');

// Spam throttle on posts only (per IP). Reading the wall stays unlimited.
const postLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many wishes — please wait a minute and try again' },
});

router.get('/', MessageController.getMessages);
router.post('/', postLimiter, MessageController.createMessage);

module.exports = router;