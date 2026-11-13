const express = require('express');
const { protect } = require('../Middleware/authMiddleware');
const { getTaskComments, createComment } = require('../Controllers/commentController');
const router = express.Router();
router.get('/task/:taskId', protect, getTaskComments);
router.post('/', protect, createComment);
module.exports = router;
