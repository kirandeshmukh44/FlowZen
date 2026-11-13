const express = require('express');
const { getNotifications, markNotificationAsRead, createNotification } = require('../Controllers/notificationController');
const { protect, authorizeRoles } = require('../Middleware/authMiddleware');

const router = express.Router();

// All notification routes now require authentication.
// Ownership checks live in the controller (self or Admin/Manager).
router.post('/', protect, authorizeRoles('Admin', 'Manager'), createNotification);
router.get('/user/:userId', protect, getNotifications);
router.patch('/:id/read', protect, markNotificationAsRead);

module.exports = router;
