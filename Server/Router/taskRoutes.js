
const express = require('express');

const {
    createTask,
    getAllTasks,
    getTaskById,
    updateTask,
    deleteTask,
    approveTask,
    sendBackTask
} = require('../Controllers/taskController');

const { protect, authorizeRoles } = require('../Middleware/authMiddleware');
const { schemas, validate, objectId } = require('../utils/validate');

const router = express.Router();

const validId = (req, res, next) => {
    if (!objectId.safeParse(req.params.id).success) {
        return res.status(400).json({ success: false, message: 'Invalid task ID' });
    }
    next();
};

// Only Admin and Manager can create tasks
router.post(
    '/',
    protect,
    authorizeRoles('Admin', 'Manager'),
    validate(schemas.createTask),
    createTask
);

// Login required to view all tasks
router.get('/', protect, getAllTasks);

router.get('/:id', protect, validId, getTaskById);
router.put('/:id', protect, authorizeRoles('Admin', 'Manager'), validId, validate(schemas.updateTask), updateTask);
router.delete('/:id', protect, authorizeRoles('Admin', 'Manager'), validId, deleteTask);

// Review workflow: approve -> Completed (+XP); send-back -> In Progress.
// Admin approves any task; Manager only team-scope (checked in controller).
router.post('/:id/approve', protect, authorizeRoles('Admin', 'Manager'), validId, approveTask);
router.post('/:id/send-back', protect, authorizeRoles('Admin', 'Manager'), validId, sendBackTask);

module.exports = router;
