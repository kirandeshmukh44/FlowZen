
const express = require('express');

const { createUser, getUsers, deleteUser, getMessageableUsers, resetPassword, assignManager } = require('../Controllers/userController');
const {
    protect,
    authorizeRoles
} = require('../Middleware/authMiddleware');
const { schemas, validate, objectId } = require('../utils/validate');

const router = express.Router();

// All roles may list users — scoping is enforced inside the controller
// (Admin: all, Manager: self+reports, Employee: self+manager+team).
router.get('/', protect, getUsers);

// DM-eligible users for chat — open to all roles (additive endpoint).
router.get('/messageable', protect, getMessageableUsers);

// Admin creates Managers/Employees; Manager creates Employees only
// (enforced inside the controller via req.user.role).
router.post(
    '/',
    protect,
    authorizeRoles('Admin', 'Manager'),
    validate(schemas.createUser),
    createUser
);

// Soft delete: Admin any user; Manager only own Employees (controller).
router.delete(
    '/:id',
    protect,
    authorizeRoles('Admin', 'Manager'),
    (req, res, next) => {
        req.params.id = String(req.params.id);
        if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }
        next();
    },
    deleteUser
);

const validObjectId = (req, res, next) => {
    req.params.id = String(req.params.id);
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
        return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    next();
};

// Assign/change an Employee's manager — Admin only.
router.put(
    '/:id/manager',
    protect,
    authorizeRoles('Admin'),
    validObjectId,
    assignManager
);

// Password reset: Admin any user; Manager only own Employees (controller).
// Returns a new tempPassword once; sets mustChangePassword=true.
router.post(
    '/:id/reset-password',
    protect,
    authorizeRoles('Admin', 'Manager'),
    validObjectId,
    resetPassword
);

module.exports = router;
