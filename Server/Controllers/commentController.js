const Comment = require('../Models/Comment');
const Task = require('../Models/Task');
const TaskAssignment = require('../Models/TaskAssignment');
const { isTaskInScope } = require('../utils/taskScope');

// Admin: all company tasks. Manager: own team scope only.
// Employee: only tasks assigned to them.
const canAccessTask = async (user, task) => {
  if (user.role === 'Admin') return true;
  if (user.role === 'Manager') return isTaskInScope(user, task);
  return Boolean(await TaskAssignment.exists({ taskId: task._id, employeeId: user._id, companyId: user.companyId }));
};

const getTaskComments = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.taskId, companyId: req.user.companyId });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (!(await canAccessTask(req.user, task))) return res.status(403).json({ success: false, message: 'You can only view comments for tasks assigned to you.' });
    const comments = await Comment.find({ taskId: task._id, companyId: req.user.companyId }).populate('userId', 'name role').sort({ createdAt: 1 });
    return res.status(200).json({ success: true, count: comments.length, comments });
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid task ID' });
    console.error('Get comments error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const createComment = async (req, res) => {
  try {
    const { taskId, commentText } = req.body;
    if (!taskId || !commentText?.trim()) return res.status(400).json({ success: false, message: 'Task ID and comment are required' });
    const task = await Task.findOne({ _id: taskId, companyId: req.user.companyId });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (!(await canAccessTask(req.user, task))) return res.status(403).json({ success: false, message: 'You can only comment on tasks assigned to you.' });
    const comment = await Comment.create({ taskId, userId: req.user._id, companyId: req.user.companyId, commentText: commentText.trim() });
    await comment.populate('userId', 'name role');
    return res.status(201).json({ success: true, comment });
  } catch (error) {
    if (error.name === 'CastError' || error.name === 'ValidationError') return res.status(400).json({ success: false, message: 'Invalid comment data' });
    console.error('Create comment error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getTaskComments, createComment };
