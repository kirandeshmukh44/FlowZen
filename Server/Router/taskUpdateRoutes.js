const express = require('express');
const {
    updateTaskProgress,
    getTaskUpdateHistory,
    getRecentTaskUpdates
} = require('../Controllers/taskUpdateController');

const router = express.Router();
const { protect, authorizeRoles } = require('../Middleware/authMiddleware');
const { schemas, validate, objectId } = require('../utils/validate');

router.get('/recent', protect, authorizeRoles('Admin', 'Manager'), getRecentTaskUpdates);
router.patch('/', protect, validate(schemas.taskUpdate), updateTaskProgress);
router.get('/task/:taskId/history', protect, (req, res, next) => {
    if (!objectId.safeParse(req.params.taskId).success) {
        return res.status(400).json({ success: false, message: 'Invalid task ID' });
    }
    next();
}, getTaskUpdateHistory);

module.exports = router;
