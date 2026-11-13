
const Task = require('../Models/Task');
const TaskAssignment = require('../Models/TaskAssignment');
const { computeAIScore, calculateUrgency, PRIORITY_TO_IMPORTANCE } = require('../utils/aiScore');
const { grantCompletionRewards } = require('../utils/rewards');
const { taskScopeFilter, isTaskInScope } = require('../utils/taskScope');

const createTask = async (req, res) => {
    try {
        // Express populates incoming request data on req.body (never res.body).
        // Keep malformed or missing bodies from causing a destructuring error.
        const body = req.body && typeof req.body === 'object' ? req.body : {};
        const {
            title,
            description,
            priority,
            deadline,
            importance,
            urgency,
            effort,
            tags,
            category
        } = body;

        if (!title || !description || !priority || !deadline) {
            return res.status(400).json({
                success: false,
                message: 'Title, description, priority and deadline are required'
            });
        }

        const validPriorities = ['Low', 'Medium', 'High', 'Critical'];

        if (!validPriorities.includes(priority)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid priority. Use Low, Medium, High, or Critical'
            });
        }

        const parsedDeadline = new Date(deadline);

        if (Number.isNaN(parsedDeadline.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid deadline. Deadline must be a valid date'
            });
        }

        // Phase 3 attributes: store what the client sent, derive the rest
        const taskDraft = {
            title: title.trim(),
            description,
            priority,
            deadline: parsedDeadline,
            importance: importance ?? PRIORITY_TO_IMPORTANCE[priority] ?? 5,
            urgency: urgency ?? calculateUrgency(parsedDeadline),
            effort: effort ?? 3,
            tags: Array.isArray(tags) ? tags : [],
            category: category || ''
        };
        taskDraft.aiScore = computeAIScore(taskDraft);

        const task = await Task.create({
            ...taskDraft,
            createdBy: req.user._id,
            companyId: req.user.companyId
        });

        return res.status(201).json({
            success: true,
            message: 'Task created successfully',
            task
        });
    } catch (error) {
        console.error('Create task error:', error.message);
        
        if (error.name === 'ValidationError' || error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid task data. Please check the input fields and try again.'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getAllTasks = async (req, res) => {
    try {
        const taskFilter = { companyId: req.user.companyId };
        if (req.user.role === 'Employee') {
            taskFilter._id = {
                $in: await TaskAssignment.distinct('taskId', {
                    employeeId: req.user._id,
                    companyId: req.user.companyId
                })
            };
        } else {
            // Manager sees only their own tasks + tasks assigned to
            // employees they created — not the whole company.
            const scope = await taskScopeFilter(req.user);
            if (scope) Object.assign(taskFilter, scope);
        }
        const tasks = await Task.find(taskFilter).sort({ createdAt: -1 }).lean();

        // Phase 3: attach assignees (from task-assignments) inline so
        // clients don't need a second round-trip. Additive field — the
        // rest of the task shape is unchanged.
        const taskIds = tasks.map((t) => t._id);
        const assignments = taskIds.length
            ? await TaskAssignment.find({
                companyId: req.user.companyId,
                taskId: { $in: taskIds }
            }).populate('employeeId', 'name email role').lean()
            : [];

        const assigneesByTask = new Map();
        for (const a of assignments) {
            const key = String(a.taskId);
            if (!assigneesByTask.has(key)) assigneesByTask.set(key, []);
            assigneesByTask.get(key).push(a.employeeId || null);
        }
        for (const t of tasks) {
            t.assignees = (assigneesByTask.get(String(t._id)) || []).filter(Boolean);
        }

        return res.status(200).json({
            success: true,
            message: 'Tasks retrieved successfully',
            count: tasks.length,
            tasks
        });
    } catch (error) {
        console.error('Get tasks error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getTaskById = async (req, res) => {
    try {
        const { id } = req.params;

        const task = await Task.findOne({ _id: id, companyId: req.user.companyId });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        if (req.user.role === 'Employee') {
            const isAssigned = await TaskAssignment.exists({
                taskId: task._id,
                employeeId: req.user._id,
                companyId: req.user.companyId
            });
            if (!isAssigned) return res.status(403).json({ success: false, message: 'You can only view tasks assigned to you.' });
        }

        if (!(await isTaskInScope(req.user, task))) {
            return res.status(403).json({ success: false, message: 'This task is outside your team scope.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Task retrieved successfully',
            task
        });
    } catch (error) {
        console.error('Get task by ID error:', error.message);

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

const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, priority, status, deadline, importance, urgency, effort, tags, category } = req.body;

        const updates = {};

        if (title !== undefined) updates.title = title.trim();
        if (description !== undefined) updates.description = description;
        if (importance !== undefined) updates.importance = importance;
        if (urgency !== undefined) updates.urgency = urgency;
        if (effort !== undefined) updates.effort = effort;
        if (tags !== undefined) updates.tags = tags;
        if (category !== undefined) updates.category = category;

        if (priority !== undefined) {
            const validPriorities = ['Low', 'Medium', 'High', 'Critical'];

            if (!validPriorities.includes(priority)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid task priority'
                });
            }

            updates.priority = priority;
        }

        if (status !== undefined) {
            const validStatuses = [
                'Pending',
                'In Progress',
                'Completed',
                'On Hold',
                'Cancelled',
                'Review'
            ];

            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid task status'
                });
            }

            updates.status = status;
        }

        if (deadline !== undefined) {
            const parsedDeadline = new Date(deadline);

            if (Number.isNaN(parsedDeadline.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid deadline'
                });
            }

            updates.deadline = parsedDeadline;
        }

        // Fetch previous status first — needed for the Completed transition check
        const prevTask = await Task.findOne({
            _id: id,
            companyId: req.user.companyId
        }).select('status createdBy');

        if (!prevTask) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        if (!(await isTaskInScope(req.user, prevTask))) {
            return res.status(403).json({
                success: false,
                message: 'You can only update tasks within your team scope'
            });
        }

        // Reopening a task clears approval metadata; completing via a
        // direct Admin/Manager status change counts as an approval.
        const completing = updates.status === 'Completed' && prevTask.status !== 'Completed';
        const reopening = updates.status && updates.status !== 'Completed' && prevTask.status === 'Completed';

        let task = await Task.findOneAndUpdate(
            { _id: id, companyId: req.user.companyId },
            { $set: updates },
            { new: true, returnDocument: 'after', runValidators: true }
        );

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        // Recompute server-side AI score from the merged document
        const score = computeAIScore(task);
        if (score !== task.aiScore) {
            task.aiScore = score;
            await task.save();
        }

        // Phase 4: manager/admin approval of completion grants XP/badges
        // to every assignee — once per task (xpAwarded guard inside).
        let rewardsGranted = null;
        if (completing) {
            task.completedAt = new Date();
            task.approvedBy = req.user._id;
            task.approvedAt = new Date();
            task.completionApproved = true;
            rewardsGranted = await grantCompletionRewards({
                companyId: req.user.companyId,
                taskId: task._id,
                approvedBy: req.user._id
            });
            await task.save();
        } else if (reopening) {
            task.completedAt = null;
            task.completionApproved = false;
            task.xpAwarded = false; // allow re-approval to re-award? keep false so new cycle can award
            task.approvedBy = null;
            task.approvedAt = null;
            await task.save();
        } else if (updates.status && updates.status !== 'Completed' && prevTask.status !== 'Completed') {
            await task.save();
        }

        return res.status(200).json({
            success: true,
            message: 'Task updated successfully',
            task,
            ...(rewardsGranted ? { rewardsGranted } : {})
        });
    } catch (error) {
        console.error('Update task error:', error.message);

        if (error.name === 'CastError' || error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid task data or ID'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await Task.findOne({ _id: id, companyId: req.user.companyId }).select('createdBy');
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        if (!(await isTaskInScope(req.user, existing))) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete tasks within your team scope'
            });
        }

        const task = await Task.findOneAndDelete({ _id: id, companyId: req.user.companyId });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Task deleted successfully'
        });
    } catch (error) {
        console.error('Delete task error:', error.message);

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

// POST /api/tasks/:id/approve — Admin any task; Manager only team-scope;
// Employee 403 (route-level). Moves Review (or any open status) to
// Completed with approval metadata + XP award (idempotent via xpAwarded).
const approveTask = async (req, res) => {
    try {
        const { id } = req.params;

        const task = await Task.findOne({ _id: id, companyId: req.user.companyId });
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }
        if (!(await isTaskInScope(req.user, task))) {
            return res.status(403).json({ success: false, message: 'This task is outside your team scope' });
        }
        if (task.status === 'Completed' && task.completionApproved) {
            return res.status(400).json({ success: false, message: 'Task is already approved and completed' });
        }

        task.status = 'Completed';
        task.completedAt = task.completedAt || new Date();
        task.approvedBy = req.user._id;
        task.approvedAt = new Date();
        task.completionApproved = true;

        const score = computeAIScore(task);
        if (score !== task.aiScore) task.aiScore = score;
        await task.save();

        const rewardsGranted = await grantCompletionRewards({
            companyId: req.user.companyId,
            taskId: task._id,
            approvedBy: req.user._id
        });
        if (rewardsGranted && rewardsGranted.length) task.xpAwarded = true;
        await task.save(); // persist xpAwarded flag

        return res.status(200).json({
            success: true,
            message: 'Task approved and completed',
            task,
            ...(rewardsGranted ? { rewardsGranted } : {})
        });
    } catch (error) {
        console.error('Approve task error:', error.message);
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid task ID' });
        }
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// POST /api/tasks/:id/send-back { note? } — sends a Review task back to
// In Progress, stores reviewNote, notifies assignees + creator.
const sendBackTask = async (req, res) => {
    try {
        const { id } = req.params;
        const note = (req.body?.note || '').trim();

        const task = await Task.findOne({ _id: id, companyId: req.user.companyId });
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }
        if (!(await isTaskInScope(req.user, task))) {
            return res.status(403).json({ success: false, message: 'This task is outside your team scope' });
        }

        task.status = 'In Progress';
        task.reviewNote = note;
        task.completedAt = null;
        task.completionApproved = false;
        await task.save();

        // Notify assignees + task creator
        const Notification = require('../Models/Notification');
        const assignments = await TaskAssignment.find({ taskId: task._id, companyId: req.user.companyId }).select('employeeId');
        const notifyIds = new Set(assignments.map((a) => a.employeeId.toString()));
        if (task.createdBy) notifyIds.add(task.createdBy.toString());
        const noteText = note ? ` — "${note}"` : '';
        await Promise.all([...notifyIds].map((uid) =>
            Notification.create({
                notificationId: `NOT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                userId: uid,
                companyId: req.user.companyId,
                message: `Task "${task.title}" was sent back for rework${noteText}.`,
                notificationType: 'Task Updated'
            })
        ));

        return res.status(200).json({
            success: true,
            message: 'Task sent back for rework',
            task
        });
    } catch (error) {
        console.error('Send back task error:', error.message);
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid task ID' });
        }
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { createTask, getAllTasks, getTaskById, updateTask, deleteTask, approveTask, sendBackTask };
