const TaskUpdate = require('../Models/TaskUpdate');
const TaskAssignment = require('../Models/TaskAssignment');
const Task = require('../Models/Task');
const User = require('../Models/User');
const Notification = require('../Models/Notification');
const { isTaskInScope, getManagerScope } = require('../utils/taskScope');

const updateTaskProgress = async (req, res) => {
    try {
        const { taskId, progressNote, newStatus } = req.body;
        const employeeId = req.user._id;

        if (!taskId || !employeeId || !newStatus) {
            return res.status(400).json({
                success: false,
                message: 'Task ID, employee ID and status are required'
            });
        }

        const validStatuses = [
            'Pending',
            'In Progress',
            'Completed',
            'On Hold',
            'Cancelled',
            'Review'
        ];

        if (!validStatuses.includes(newStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid task status'
            });
        }

        // Employees cannot self-approve: a "Done"/Completed request from an
        // employee is stored as Review and awaits Admin/Manager approval.
        const effectiveStatus = req.user.role === 'Employee' && newStatus === 'Completed'
            ? 'Review'
            : newStatus;

        const employee = await User.findOne({
            _id: employeeId,
            companyId: req.user.companyId
        });

        if (!employee || employee.role !== 'Employee') {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        const assignment = await TaskAssignment.findOne({
            taskId,
            employeeId,
            companyId: req.user.companyId
        });

        if (!assignment) {
            return res.status(403).json({
                success: false,
                message: 'This task is not assigned to this employee'
            });
        }

        // Employee-driven status change. Moving OUT of 'Completed' resets
        // the approval flag so a manager can re-approve (and re-grant) later.
        // 'Completed' requests from employees land on 'Review' (effectiveStatus)
        // and do NOT grant rewards — approval via /tasks/:id/approve or PUT.
        const updateFields = { status: effectiveStatus };
        if (effectiveStatus === 'Completed') {
            updateFields.completedAt = new Date();
        } else {
            updateFields.completedAt = null;
            updateFields.completionApproved = false;
        }
        if (effectiveStatus === 'Review') updateFields.reviewNote = '';

        const task = await Task.findOneAndUpdate(
            { _id: taskId, companyId: req.user.companyId },
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        const taskUpdate = await TaskUpdate.create({
            taskId,
            updatedBy: employeeId,
            companyId: req.user.companyId,
            progressNote: progressNote || '',
            newStatus: effectiveStatus,
            updateId: `UPD-${Date.now()}-${Math.random()
                .toString(36).slice(2, 8)}`
        });

        // Notify the task creator, the employee's manager AND creator
        // (covers admin-created tasks working under a manager).
        const notifyUserIds = new Set();
        if (task.createdBy) notifyUserIds.add(task.createdBy.toString());
        if (employee.managerId) notifyUserIds.add(employee.managerId.toString());
        if (employee.createdBy) notifyUserIds.add(employee.createdBy.toString());

        await Promise.all([...notifyUserIds].map((uid) =>
            Notification.create({
                notificationId: `NOT-${Date.now()}-${Math.random()
                    .toString(36).slice(2, 8)}`,
                userId: uid,
                companyId: req.user.companyId,
                message: `Task "${task.title}" status changed to ${effectiveStatus}.`,
                notificationType: effectiveStatus === 'Review'
                    ? 'Task Completed'
                    : 'Task Updated'
            })
        ));

        return res.status(201).json({
            success: true,
            message: 'Task progress updated successfully',
            task,
            taskUpdate
        });
    } catch (error) {
        console.error('Update task progress error:', error.message);

        if (
            error.name === 'CastError' ||
            error.name === 'ValidationError'
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid task update data'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getTaskUpdateHistory = async (req, res) => {
    try {
        const { taskId } = req.params;

        const task = await Task.findOne({ _id: taskId, companyId: req.user.companyId });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        if (req.user.role === 'Employee') {
            const assigned = await TaskAssignment.exists({
                taskId: task._id,
                employeeId: req.user._id,
                companyId: req.user.companyId
            });
            if (!assigned) return res.status(403).json({ success: false, message: 'You can only view updates for tasks assigned to you.' });
        }

        if (!(await isTaskInScope(req.user, task))) {
            return res.status(403).json({ success: false, message: 'This task is outside your team scope.' });
        }

        const updates = await TaskUpdate.find({ taskId, companyId: req.user.companyId })
            .populate('updatedBy', 'name email role')
            .sort({ updatedOn: -1 });

        return res.status(200).json({
            success: true,
            count: updates.length,
            updates
        });
    } catch (error) {
        console.error('Get task history error:', error.message);

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid task ID'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getRecentTaskUpdates = async (req, res) => {
    try {
        const filter = { companyId: req.user.companyId };
        if (req.user.role === 'Manager') {
            const scope = await getManagerScope(req.user);
            if (scope) filter.taskId = { $in: scope.taskIds };
        }
        const updates = await TaskUpdate.find(filter).populate('updatedBy', 'name role').populate('taskId', 'title').sort({ updatedOn: -1 }).limit(8);
        return res.status(200).json({ success: true, count: updates.length, updates });
    } catch (error) {
        console.error('Get recent task updates error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { updateTaskProgress, getTaskUpdateHistory, getRecentTaskUpdates };
