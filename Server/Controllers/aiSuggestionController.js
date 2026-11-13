const AISuggestion = require('../Models/AISuggestion');
const Task = require('../Models/Task');
const TaskAssignment = require('../Models/TaskAssignment');
const { isTaskInScope } = require('../utils/taskScope');

// Admin: all company tasks. Manager: team scope only.
// Employee: only tasks assigned to them.
const canAccessTask = async (user, task) => {
    if (user.role === 'Admin') return true;
    if (user.role === 'Manager') return isTaskInScope(user, task);
    return Boolean(await TaskAssignment.exists({ taskId: task._id, employeeId: user._id, companyId: user.companyId }));
};


const createSuggestion = async (req, res) => {
    try {
        const { taskId } = req.body;

        if (!taskId) {
            return res.status(400).json({
                success: false,
                message: 'Task ID is required'
            });
        }

        const task = await Task.findOne({ _id: taskId, companyId: req.user.companyId });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        if (!(await canAccessTask(req.user, task))) {
            return res.status(403).json({ success: false, message: 'This task is outside your access scope.' });
        }

        const suggestions = [];

        // Suggestion based on priority
        if (task.priority === 'Critical' || task.priority === 'High') {
            suggestions.push(
                'Give this task high priority and start working on it as soon as possible.'
            );
        } else if (task.priority === 'Low') {
            suggestions.push(
                'Schedule this task after completing higher-priority tasks.'
            );
        }

        // Suggestion based on status
        if (task.status === 'Pending') {
            suggestions.push(
                'Break this task into smaller steps before starting.'
            );
        } else if (task.status === 'In Progress') {
            suggestions.push(
                'Review the remaining work and update progress regularly.'
            );
        } else if (task.status === 'On Hold') {
            suggestions.push(
                'Identify the blocker and resolve it before continuing.'
            );
        } else if (task.status === 'Completed') {
            suggestions.push(
                'Review the completed work and document the outcome.'
            );
        }

        // Suggestion based on deadline
        const remainingTime = new Date(task.deadline).getTime() - Date.now();
        const oneDay = 24 * 60 * 60 * 1000;

        if (remainingTime < 0 && task.status !== 'Completed') {
            suggestions.push(
                'The deadline has passed. Review the delay and agree on a revised deadline.'
            );
        } else if (remainingTime <= oneDay && task.status !== 'Completed') {
            suggestions.push(
                'The deadline is within 24 hours. Focus on the essential remaining work.'
            );
        }

        if (suggestions.length === 0) {
            suggestions.push(
                'Continue following the task plan and review progress before the deadline.'
            );
        }

        const suggestionText = suggestions.join(' ');
        const priorityPoints = { Critical: 45, High: 35, Medium: 22, Low: 12 }[task.priority] || 12;
        const remainingDays = Math.ceil(remainingTime / oneDay);
        const urgencyPoints = remainingDays < 0 ? 35 : remainingDays <= 1 ? 32 : remainingDays <= 3 ? 25 : remainingDays <= 7 ? 16 : 8;
        const statusPoints = task.status === 'In Progress' ? 8 : task.status === 'Completed' ? 0 : 5;
        const priorityScore = Math.min(99, priorityPoints + urgencyPoints + statusPoints);

        const suggestion = await AISuggestion.create({
            suggestionId: `SUG-${Date.now()}-${Math.random()
                .toString(36).slice(2, 8)}`,
            taskId: task._id,
            companyId: req.user.companyId,
            suggestionText
        });

        return res.status(201).json({
            success: true,
            message: 'Task suggestions generated successfully',
            task: {
                id: task._id,
                title: task.title,
                priority: task.priority,
                status: task.status,
                deadline: task.deadline,
                priorityScore
            },
            suggestion
        });
    } catch (error) {
        console.error('Generate suggestion error:', error.message);

        if (
            error.name === 'CastError' ||
            error.name === 'ValidationError'
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid task data'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getTaskSuggestions = async (req, res) => {
    try {
        const { taskId } = req.params;

        const task = await Task.findOne({ _id: taskId, companyId: req.user.companyId });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        if (!(await canAccessTask(req.user, task))) {
            return res.status(403).json({ success: false, message: 'This task is outside your access scope.' });
        }

        const suggestions = await AISuggestion.find({ taskId, companyId: req.user.companyId })
            .sort({ createdOn: -1 });

        return res.status(200).json({
            success: true,
            count: suggestions.length,
            suggestions
        });
    } catch (error) {
        console.error('Get suggestions error:', error.message);

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

module.exports = {
    createSuggestion,
    getTaskSuggestions
};
