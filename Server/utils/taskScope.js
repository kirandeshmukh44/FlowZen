const User = require('../Models/User');
const Task = require('../Models/Task');
const TaskAssignment = require('../Models/TaskAssignment');

// Manager scope = their own created tasks + tasks assigned to Employees
// they created. Admin/Employee return null (unrestricted / handled elsewhere).
const getManagerScope = async (user) => {
    if (!user || user.role !== 'Manager') return null;

    const companyId = user.companyId;

    const employeeIds = await User.distinct('_id', {
        companyId,
        role: 'Employee',
        accountStatus: 'Active',
        $or: [
            { createdBy: user._id },
            { managerId: user._id }
        ]
    });

    const assignedTaskIds = employeeIds.length
        ? await TaskAssignment.distinct('taskId', {
            companyId,
            employeeId: { $in: employeeIds }
        })
        : [];

    const ownTaskIds = await Task.distinct('_id', {
        companyId,
        createdBy: user._id
    });

    const taskIdSet = new Set();
    for (const id of [...assignedTaskIds, ...ownTaskIds]) taskIdSet.add(String(id));

    return {
        employeeIds: employeeIds.map(String),
        taskIds: [...taskIdSet]
    };
};

// Mongo filter fragment for Task queries. null => no extra restriction.
const taskScopeFilter = async (user) => {
    const scope = await getManagerScope(user);
    if (!scope) return null;
    return {
        $or: [
            { createdBy: user._id },
            { _id: { $in: scope.taskIds } }
        ]
    };
};

// True when the task is inside the Manager's team scope (always true for Admin).
const isTaskInScope = async (user, task) => {
    const scope = await getManagerScope(user);
    if (!scope) return true;
    if (task.createdBy && task.createdBy.toString() === user._id.toString()) return true;
    return scope.taskIds.includes(String(task._id));
};

// True when target user reports to this Manager — via managerId or
// (legacy) createdBy.
const isOwnEmployee = (manager, target) => {
    if (!target || target.role !== 'Employee') return false;
    const mid = target.managerId && target.managerId.toString();
    const cid = target.createdBy && target.createdBy.toString();
    const uid = manager._id.toString();
    return mid === uid || (!mid && cid === uid);
};

module.exports = { getManagerScope, taskScopeFilter, isTaskInScope, isOwnEmployee };
