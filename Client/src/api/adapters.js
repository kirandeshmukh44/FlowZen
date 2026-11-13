// Adapters that normalize backend (Express/MongoDB) payloads into the
// shapes the existing FlowZen UI components expect.
//
// Backend Task document (Server/Models/Task.js):
//   { _id, title, description, priority: Low|Medium|High|Critical,
//     status: Pending|In Progress|Completed|On Hold|Cancelled,
//     creationDate, deadline, createdBy, createdAt, updatedAt }
// There are NO importance/urgency/effort/tags/aiScore fields on the
// backend — those remain client-side computed (see utils/aiScore.js).

// Backend status -> Kanban column id used by the UI.
// NOTE: the backend has no dedicated "Review" or "Backlog" statuses.
// Mapping: Pending -> backlog, In Progress -> in_progress,
// On Hold -> review, Completed -> done, Cancelled -> backlog
// (status is preserved as 'Cancelled' so it is not silently lost).
export const STATUS_TO_COLUMN = {
  'Pending': 'backlog',
  'In Progress': 'in_progress',
  'Completed': 'done',
  'On Hold': 'review',
  'Review': 'review',
  'Cancelled': 'backlog',
};

// Kanban column id -> backend status value
export const COLUMN_TO_STATUS = {
  backlog: 'Pending',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Completed',
};

// UI status label shown on cards
export const STATUS_LABEL = {
  'Pending': 'Backlog',
  'In Progress': 'In Progress',
  'Completed': 'Done',
  'On Hold': 'Review',
  'Review': 'Review',
  'Cancelled': 'Cancelled',
};

const PRIORITY_TO_IMPORTANCE = {
  'Low': 3,
  'Medium': 5,
  'High': 8,
  'Critical': 10,
};

const DEFAULT_EFFORT = 3;

export function normalizeTask(task, assignees = []) {
  if (!task) return null;
  const backendStatus = task.status || 'Pending';
  const column = STATUS_TO_COLUMN[backendStatus] || 'backlog';
  const completed = backendStatus === 'Completed';
  const priority = task.priority || 'Medium';

  const memberAssignees = assignees.filter(Boolean);
  const primary = memberAssignees[0] || null;

  const hasExplicitImportance = typeof task.importance === 'number';
  const hasExplicitEffort = typeof task.effort === 'number';
  const isEstimated = !hasExplicitImportance || !hasExplicitEffort;

  return {
    id: task._id || task.id,
    title: task.title || '',
    description: task.description || '',
    backendStatus,
    status: STATUS_LABEL[backendStatus] || backendStatus,
    column,
    completed,
    priority,
    importance: hasExplicitImportance ? task.importance : (PRIORITY_TO_IMPORTANCE[priority] ?? 5),
    urgency: typeof task.urgency === 'number' ? task.urgency : undefined,
    effort: hasExplicitEffort ? task.effort : DEFAULT_EFFORT,
    isEstimated,
    deadline: task.deadline ? (() => { const d = new Date(task.deadline); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })() : '',
    progress: completed ? 100 : (column === 'in_progress' ? 50 : (column === 'review' ? 80 : 10)),
    assignee: primary,
    assignees: memberAssignees,
    tags: Array.isArray(task.tags) ? task.tags : [],
    category: task.category || '',
    tagColor: 'rose',
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    completedAt: task.completedAt || (completed ? (task.updatedAt || task.createdAt) : null),
    completionApproved: task.completionApproved,
    approvedBy: task.approvedBy || null,
    approvedAt: task.approvedAt || null,
    reviewNote: task.reviewNote || '',
    xpAwarded: task.xpAwarded || false,
    createdBy: task.createdBy,
    aiScore: task.aiScore,
  };
}

// GET /api/users -> [{ _id, name, email, role, accountStatus, createdAt }]
// -> UI team member shape { id, name, email, role, avatar, online, ... }
export function normalizeTeamMember(user) {
  if (!user) return null;
  return {
    id: user._id || user.id,
    name: user.name || user.email || 'Unknown',
    email: user.email || '',
    role: user.role || 'Employee',
    createdBy: user.createdBy || null,
    managerId: user.managerId || null,
    avatar: user.profilePhoto?.url || user.avatar || null,
    profilePhoto: user.profilePhoto || { url: user.avatar || null, publicId: null },
    online: false,
    capacity: 0,
    tasksCount: 0,
    completedCount: 0,
    xp: 0,
    level: 'Beginner',
  };
}

// Backend assignment doc (populated): { _id, taskId: {...}|id, employeeId: {...}|id }
export function assignmentToAssignee(assignment, memberLookup) {
  const emp = assignment?.employeeId;
  const empId = typeof emp === 'object' && emp !== null ? emp._id : emp;
  if (emp && typeof emp === 'object') {
    return normalizeTeamMember(emp);
  }
  return memberLookup?.get?.(String(empId)) || null;
}
