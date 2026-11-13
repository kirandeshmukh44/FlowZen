const express = require('express');
const { protect } = require('../Middleware/authMiddleware');
const { listMessages, createMessage } = require('../Controllers/chatController');
const router = express.Router();
router.get('/messages', protect, listMessages);
router.post('/messages', protect, createMessage);
module.exports = router;
