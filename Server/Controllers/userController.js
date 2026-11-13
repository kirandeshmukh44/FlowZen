
const bcrypt = require('bcryptjs');
const User = require('../Models/User');
const TaskAssignment = require('../Models/TaskAssignment');
const { generateTempPassword } = require('../utils/tempPassword');

const publicUser = (u) => ({
    id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    accountStatus: u.accountStatus,
    mustChangePassword: !!u.mustChangePassword,
    managerId: u.managerId || null,
    profilePhoto: u.profilePhoto || { url: null, publicId: null },
    createdBy: u.createdBy || null,
    createdAt: u.createdAt
});

// GET /api/users
// Admin    -> all Active users in the company
// Manager  -> self + Employees whose managerId = me (createdBy fallback)
// Employee -> self + their manager (+ manager's other reports = "team")
const getUsers = async (req, res) => {
    try {
        const me = req.user._id;
        let filter;

        if (req.user.role === 'Admin') {
            filter = { accountStatus: 'Active', companyId: req.user.companyId };
        } else if (req.user.role === 'Manager') {
            filter = {
                accountStatus: 'Active',
                companyId: req.user.companyId,
                $or: [
                    { _id: me },
                    { managerId: me },
                    { role: 'Employee', createdBy: me, managerId: null }
                ]
            };
        } else {
            // Employee: self + manager + teammates under same manager
            const myDoc = await User.findById(me).select('managerId createdBy');
            const managerId = myDoc?.managerId || myDoc?.createdBy || null;
            const or = [{ _id: me }];
            if (managerId) {
                or.push({ _id: managerId }, { managerId }, { createdBy: managerId });
            }
            filter = { accountStatus: 'Active', companyId: req.user.companyId, $or: or };
        }

        const users = await User.find(filter)
            .select('name email role accountStatus mustChangePassword createdBy managerId createdAt profilePhoto')
            .sort({ name: 1 });
        return res.status(200).json({
            success: true,
            count: users.length,
            users: users.map(publicUser)
        });
    } catch (error) {
        console.error('Get users error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// GET /api/users/messageable
// Users the current user is allowed to start a DM with (same rules as
// POST /api/conversations type 'dm'). Available to every role.
const getMessageableUsers = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const me = req.user._id.toString();
        const users = await User.find({
            companyId,
            accountStatus: 'Active',
            _id: { $ne: req.user._id }
        }).select('name email role createdBy').sort({ name: 1 });

        const allowed = users.filter((u) => {
            if (req.user.role === 'Admin') return true;
            const uid = u._id.toString();
            const createdByMe = u.createdBy && u.createdBy.toString() === me;
            const createdMe = req.user.createdBy && req.user.createdBy.toString() === uid;
            if (req.user.role === 'Employee') {
                return u.role === 'Admin' || createdMe;
            }
            // Manager
            return u.role === 'Admin' || (u.role === 'Employee' && createdByMe);
        });

        return res.status(200).json({
            success: true,
            count: allowed.length,
            users: allowed.map(publicUser)
        });
    } catch (error) {
        console.error('Get messageable users error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// POST /api/users { name, email, role }
// Hierarchy: Admin may create Manager|Employee; Manager may create Employee only.
// Password is generated server-side and returned ONCE as tempPassword.
const createUser = async (req, res) => {
    try {
        const { name, email, role } = req.body;

        const allowedRoles = req.user.role === 'Admin' ? ['Manager', 'Employee'] : ['Employee'];
        if (!allowedRoles.includes(role)) {
            return res.status(403).json({
                success: false,
                message: req.user.role === 'Admin'
                    ? 'Role must be Manager or Employee'
                    : 'Managers can only create Employee accounts'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Email is unique per company (compound unique index).
        const existingUser = await User.findOne({
            email: normalizedEmail,
            companyId: req.user.companyId
        });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Email is already registered'
            });
        }

        const tempPassword = generateTempPassword();
        const passwordHash = await bcrypt.hash(tempPassword, 12);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            passwordHash,
            role,
            companyId: req.user.companyId,
            mustChangePassword: true,
            createdBy: req.user._id,
            // Employees created by a Manager report to that manager.
            // Admin may pass managerId explicitly; otherwise null.
            managerId: role === 'Employee'
                ? (req.user.role === 'Manager' ? req.user._id : (req.body.managerId || null))
                : null
        });

        return res.status(201).json({
            success: true,
            message: `${role} account created successfully. Share the temporary password securely — it is shown only once.`,
            user: publicUser(user),
            tempPassword
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Email is already registered'
            });
        }

        console.error('Create user error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// DELETE /api/users/:id — soft delete (accountStatus = 'Inactive').
// Admin may delete any user; Manager may delete only Employees they created.
// Open task assignments for the user are removed (unassigned).
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const target = await User.findOne({ _id: id, companyId: req.user.companyId });
        if (!target) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (req.user.role === 'Manager') {
            const isOwnEmployee = target.role === 'Employee' &&
                target.createdBy && target.createdBy.toString() === req.user._id.toString();
            if (!isOwnEmployee) {
                return res.status(403).json({
                    success: false,
                    message: 'Managers can only remove Employees they created'
                });
            }
        } else if (req.user.role !== 'Admin') {
            return res.status(403).json({ success: false, message: 'Not permitted' });
        }

        if (target._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
        }

        target.accountStatus = 'Inactive';
        await target.save();

        // Unassign their open tasks so they no longer appear for the user
        // and the task is freed for reassignment.
        const unassigned = await TaskAssignment.deleteMany({ employeeId: target._id, companyId: req.user.companyId });

        return res.status(200).json({
            success: true,
            message: 'User deactivated successfully',
            unassignedTasks: unassigned.deletedCount || 0
        });
    } catch (error) {
        console.error('Delete user error:', error.message);
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// POST /api/users/:id/reset-password
// Admin may reset any same-company user; Manager only Employees they created.
// Generates a NEW temp password, forces mustChangePassword=true on next login,
// and returns the plaintext ONCE — only the bcrypt hash is stored.
const resetPassword = async (req, res) => {
    try {
        const { id } = req.params;

        const target = await User.findOne({ _id: id, companyId: req.user.companyId });
        if (!target) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (target._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Use change-password to reset your own password'
            });
        }

        if (req.user.role === 'Manager') {
            const isOwnEmployee = target.role === 'Employee' &&
                target.createdBy && target.createdBy.toString() === req.user._id.toString();
            if (!isOwnEmployee) {
                return res.status(403).json({
                    success: false,
                    message: 'Managers can only reset passwords for Employees they created'
                });
            }
        } else if (req.user.role !== 'Admin') {
            return res.status(403).json({ success: false, message: 'Not permitted' });
        }

        if (target.accountStatus !== 'Active') {
            return res.status(400).json({ success: false, message: 'Cannot reset password for an inactive account' });
        }

        const tempPassword = generateTempPassword();
        target.passwordHash = await bcrypt.hash(tempPassword, 12);
        target.mustChangePassword = true;
        await target.save();

        return res.status(200).json({
            success: true,
            message: `Password reset for ${target.name}. Share the temporary password securely — it is shown only once.`,
            user: publicUser(target),
            tempPassword
        });
    } catch (error) {
        console.error('Reset password error:', error.message);
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// PUT /api/users/:id/manager { managerId } — Admin only (route-enforced).
// Assigns/changes an Employee's manager. managerId must be an Active
// Manager or Admin in the same company (or null to unassign).
const assignManager = async (req, res) => {
    try {
        const { id } = req.params;
        const { managerId } = req.body || {};

        const target = await User.findOne({ _id: id, companyId: req.user.companyId });
        if (!target) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (target.role !== 'Employee') {
            return res.status(400).json({ success: false, message: 'Only Employees can have a manager assigned' });
        }

        if (managerId) {
            const manager = await User.findOne({
                _id: managerId,
                companyId: req.user.companyId,
                accountStatus: 'Active',
                role: { $in: ['Admin', 'Manager'] }
            });
            if (!manager) {
                return res.status(400).json({ success: false, message: 'Manager not found or not permitted' });
            }
            target.managerId = manager._id;
        } else {
            target.managerId = null;
        }
        await target.save();

        return res.status(200).json({
            success: true,
            message: managerId ? 'Manager assigned' : 'Manager removed',
            user: publicUser(target)
        });
    } catch (error) {
        console.error('Assign manager error:', error.message);
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { createUser, getUsers, deleteUser, getMessageableUsers, resetPassword, assignManager };
