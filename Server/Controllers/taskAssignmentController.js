
const TaskAssignment = require('../Models/TaskAssignment');
const Task = require('../Models/Task');
const User = require('../Models/User');
const Notification = require('../Models/Notification');
const { getManagerScope, isTaskInScope, isOwnEmployee } = require('../utils/taskScope');

// Assign a task to an Employee
const assignTask = async (req, res) => {
    try {
        const { taskId, employeeId } = req.body;

        if (!taskId || !employeeId) {
            return res.status(400).json({
                success: false,
                message: 'Task ID and Employee ID are required'
            });
        }

        const task = await Task.findOne({ _id: taskId, companyId: req.user.companyId });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        const employee = await User.findOne({
            _id: employeeId,
            companyId: req.user.companyId
        });

        if (!employee || employee.role !== 'Employee') {
            return res.status(404).json({
                success: false,
                message: 'Valid employee not found'
            });
        }

        // Manager may only assign tasks inside their team scope to
        // Employees they created — never another manager's people/tasks.
        if (req.user.role === 'Manager') {
            if (!isOwnEmployee(req.user, employee)) {
                return res.status(403).json({
                    success: false,
                    message: 'Managers can only assign tasks to Employees they created'
                });
            }
            if (!(await isTaskInScope(req.user, task))) {
                return res.status(403).json({
                    success: false,
                    message: 'This task is outside your team scope'
                });
            }
        }

        if (employee.accountStatus !== 'Active') {
            return res.status(400).json({
                success: false,
                message: 'Employee account is not active'
            });
        }

        const assignment = await TaskAssignment.create({
            taskId,
            employeeId,
            companyId: req.user.companyId,
            assignmentId: `ASG-${Date.now()}-${Math.random()
                .toString(36).slice(2, 8)}`
        });

        await Notification.create({
            notificationId: `NOT-${Date.now()}-${Math.random()
                .toString(36).slice(2, 8)}`,
            userId: employeeId,
            companyId: req.user.companyId,
            message: `A new task "${task.title}" has been assigned to you.`,
            notificationType: 'Task Assigned'
        });

        return res.status(201).json({
            success: true,
            message: 'Task assigned successfully',
            assignment
        });

    } catch (error) {
        console.error('Assign task error:', error.message);

        if (
            error.name === 'ValidationError' ||
            error.name === 'CastError'
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid task or employee ID'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// Get all task assignments (Admin: whole company; Manager: own team only)
const getAllAssignments = async (req, res) => {
    try {
        const filter = { companyId: req.user.companyId };

        if (req.user.role === 'Manager') {
            const scope = await getManagerScope(req.user);
            if (scope) {
                filter.$or = [
                    { employeeId: { $in: scope.employeeIds } },
                    { taskId: { $in: scope.taskIds } }
                ];
            }
        }

        const assignments = await TaskAssignment.find(filter)
            .populate('taskId')
            .populate('employeeId', 'name email role')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: assignments.length,
            assignments
        });

    } catch (error) {
        console.error('Get assignments error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// Get assignments for a specific Employee
const getEmployeeTasks = async (req, res) => {
    try {
        const { employeeId } = req.params;

        // Employee can only view their own tasks
        if (
            req.user.role === 'Employee' &&
            req.user._id.toString() !== employeeId
        ) {
            return res.status(403).json({
                success: false,
                message: 'You can only view your own assigned tasks.'
            });
        }

        const employee = await User.findOne({
            _id: employeeId,
            companyId: req.user.companyId
        });

        // Manager can only inspect Employees they created.
        if (req.user.role === 'Manager' && !isOwnEmployee(req.user, employee)) {
            return res.status(403).json({
                success: false,
                message: 'Managers can only view tasks of Employees they created'
            });
        }

        if (!employee || employee.role !== 'Employee') {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        const assignments = await TaskAssignment.find({
            employeeId,
            companyId: req.user.companyId
        })
            .populate('taskId')
            .populate('employeeId', 'name email')
            .sort({ assignedOn: -1 });

        return res.status(200).json({
            success: true,
            count: assignments.length,
            assignments
        });

    } catch (error) {
        console.error('Get employee tasks error:', error.message);

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid employee ID'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


module.exports = {
    assignTask,
    getAllAssignments,
    getEmployeeTasks
};
