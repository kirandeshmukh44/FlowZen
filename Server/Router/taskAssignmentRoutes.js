
const express = require('express');

const {
    assignTask,
    getAllAssignments,
    getEmployeeTasks
} = require('../Controllers/taskAssignmentController');

const {
    protect,
    authorizeRoles
} = require('../Middleware/authMiddleware');
const { schemas, validate, objectId } = require('../utils/validate');

const router = express.Router();

const validEmployeeId = (req, res, next) => {
    if (!objectId.safeParse(req.params.employeeId).success) {
        return res.status(400).json({ success: false, message: 'Invalid employee ID' });
    }
    next();
};

// Admin and Manager can assign tasks
router.post(
    '/',
    protect,
    authorizeRoles('Admin', 'Manager'),
    validate(schemas.assignTask),
    assignTask
);

// Admin and Manager can view all assignments
router.get(
    '/',
    protect,
    authorizeRoles('Admin', 'Manager'),
    getAllAssignments
);

// Logged-in users can access this route,
// but Employees can view only their own tasks
router.get(
    '/employee/:employeeId',
    protect,
    validEmployeeId,
    getEmployeeTasks
);

module.exports = router;
