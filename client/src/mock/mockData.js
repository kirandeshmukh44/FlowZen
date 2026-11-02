// Realistic standalone mock data for FlowZen

export const initialTeamMembers = [
  {
    id: 'user-1',
    name: 'Ranu Sen',
    email: 'ranu@flowzen.ai',
    role: 'Admin',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    online: true,
    capacity: 85,
    tasksCount: 6,
    completedCount: 14,
    xp: 2400,
    level: 'Elite'
  },
  {
    id: 'user-2',
    name: 'Gayatri Joshi',
    email: 'gayatri@flowzen.ai',
    role: 'Manager',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    online: true,
    capacity: 72,
    tasksCount: 4,
    completedCount: 11,
    xp: 1850,
    level: 'Advanced'
  },
  {
    id: 'user-3',
    name: 'Mansi Patil',
    email: 'mansi@flowzen.ai',
    role: 'Employee',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
    online: false,
    capacity: 60,
    tasksCount: 5,
    completedCount: 9,
    xp: 1400,
    level: 'Intermediate'
  },
  {
    id: 'user-4',
    name: 'Kiran Deshmukh',
    email: 'kiran@flowzen.ai',
    role: 'Admin',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    online: true,
    capacity: 90,
    tasksCount: 7,
    completedCount: 18,
    xp: 3100,
    level: 'Elite'
  },
  {
    id: 'user-5',
    name: 'Sneha More',
    email: 'sneha@flowzen.ai',
    role: 'Employee',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    online: true,
    capacity: 45,
    tasksCount: 3,
    completedCount: 8,
    xp: 1200,
    level: 'Intermediate'
  }
];

export const projectStreams = [
  { id: 'proj-1', name: 'AI Prioritizer Engine', code: 'AIP', active: true, progress: 78 },
  { id: 'proj-2', name: 'Mobile App Zen UI', code: 'MAZ', active: false, progress: 45 },
  { id: 'proj-3', name: 'Cloud Sync & Sockets', code: 'CSS', active: false, progress: 92 },
  { id: 'proj-4', name: 'Automated Analytics', code: 'AAA', active: false, progress: 60 }
];

export const initialTasks = [
  {
    id: 'task-1',
    title: 'Frontend Review & Glassmorphism Polish',
    description: 'Ensure luxury frosted glass styling with rose shadows matches Figma specs across all breakpoints.',
    status: 'In Progress',
    column: 'in_progress',
    importance: 9,
    urgency: 9,
    effort: 3,
    deadline: '2026-11-02',
    progress: 75,
    assignee: initialTeamMembers[0], // Ranu
    tags: ['Design', 'UI/UX'],
    tagColor: 'rose',
    completed: false
  },
  {
    id: 'task-2',
    title: 'API Integration & Auth Guards',
    description: 'Connect JWT authentication endpoints, auto-redirect by role, and verify token refresh interceptor.',
    status: 'In Progress',
    column: 'in_progress',
    importance: 10,
    urgency: 8,
    effort: 4,
    deadline: '2026-11-03',
    progress: 60,
    assignee: initialTeamMembers[3], // Kiran
    tags: ['Backend', 'Security'],
    tagColor: 'cyan',
    completed: false
  },
  {
    id: 'task-3',
    title: 'Schema Review & MongoDB Indexing',
    description: 'Audit tasks, users, and audit logs collections for query performance with compound indexes.',
    status: 'Review',
    column: 'review',
    importance: 8,
    urgency: 6,
    effort: 2,
    deadline: '2026-11-05',
    progress: 90,
    assignee: initialTeamMembers[1], // Gayatri
    tags: ['Database'],
    tagColor: 'purple',
    completed: false
  },
  {
    id: 'task-4',
    title: 'Frontend UI Fixes & Contrast Calibration',
    description: 'Refine WCAG AA contrast ratio for dusty rose on cream backgrounds.',
    status: 'Backlog',
    column: 'backlog',
    importance: 7,
    urgency: 7,
    effort: 2,
    deadline: '2026-11-06',
    progress: 30,
    assignee: initialTeamMembers[2], // Mansi
    tags: ['Accessibility', 'CSS'],
    tagColor: 'amber',
    completed: false
  },
  {
    id: 'task-5',
    title: 'Project UI Fixes & Responsive Breakpoints',
    description: 'Fix sticky sidebar collapse on mobile devices and tablet portrait mode.',
    status: 'Backlog',
    column: 'backlog',
    importance: 6,
    urgency: 5,
    effort: 3,
    deadline: '2026-11-08',
    progress: 10,
    assignee: initialTeamMembers[4], // Sneha
    tags: ['Responsive'],
    tagColor: 'rose',
    completed: false
  },
  {
    id: 'task-6',
    title: 'AI Priority Tuning & Formula Verification',
    description: 'Validate weighted formula live normalization across 0-100 scales with dynamic weights.',
    status: 'Done',
    column: 'done',
    importance: 9,
    urgency: 5,
    effort: 4,
    deadline: '2026-10-29',
    progress: 100,
    assignee: initialTeamMembers[3], // Kiran
    tags: ['Algorithm', 'AI'],
    tagColor: 'cyan',
    completed: true,
    completedAt: '2026-10-30T10:00:00Z'
  }
];

export const initialGamification = {
  userLevel: 'Advanced',
  xp: 1850,
  nextLevelXp: 2500,
  taskStreak: 15,
  latestBadge: 'Focus Mastery Badge',
  badges: [
    { id: 'b-1', name: 'Focus Mastery', description: 'Complete 10 high-priority tasks on time', icon: '🎯', unlocked: true, unlockedDate: 'Oct 28' },
    { id: 'b-2', name: 'Milestone Rose', description: 'Maintain a 14-day zen task streak', icon: '🌹', unlocked: true, unlockedDate: 'Oct 29' },
    { id: 'b-3', name: 'Sprint Velocity Star', description: 'Deliver 5 tasks in a single 48-hour sprint', icon: '⚡', unlocked: true, unlockedDate: 'Oct 25' },
    { id: 'b-4', name: 'Zen Architect', description: 'Calibrate team AI weights to 95% alignment', icon: '👑', unlocked: false }
  ]
};

export const kpiMetrics = {
  openTasks: 26,
  openTasksTrend: [12, 16, 19, 22, 20, 24, 26],
  avgVelocity: '1.2k',
  velocityTrend: [
    { day: 'Mon', velocity: 850 },
    { day: 'Tue', velocity: 940 },
    { day: 'Wed', velocity: 1100 },
    { day: 'Thu', velocity: 1050 },
    { day: 'Fri', velocity: 1240 },
    { day: 'Sat', velocity: 1180 },
    { day: 'Sun', velocity: 1300 }
  ],
  aiAlignmentScore: 94,
  aiAlignmentTrend: [80, 84, 88, 91, 93, 94],
  aiInsightsCount: '60%',
  aiInsightsTrend: [40, 48, 52, 55, 58, 60]
};

export const initialAIInsights = [
  {
    id: 'ins-1',
    type: 'workload',
    severity: 'warning',
    title: 'Workload Imbalance Detected',
    description: 'Kiran Deshmukh has 7 active tasks (90% capacity). Consider delegating "Frontend Review" to Mansi Patil.',
    actionLabel: 'Rebalance Tasks'
  },
  {
    id: 'ins-2',
    type: 'deadline',
    severity: 'urgent',
    title: 'Deadline Proximity Warning',
    description: '2 high-priority tasks are due within 72 hours. Increase Urgency Weight (Wu) to keep them at top of queue.',
    actionLabel: 'Boost Urgency Weight'
  },
  {
    id: 'ins-3',
    type: 'velocity',
    severity: 'positive',
    title: 'Team Velocity +18% Above Average',
    description: 'Sprint completion rate reached 94% with current AI weight distribution.',
    actionLabel: 'Lock Optimal Weights'
  }
];

export const initialNotifications = [
  { id: 'notif-1', title: 'Task assigned', message: 'You have been assigned to Frontend Review', time: '10m ago', read: false },
  { id: 'notif-2', title: 'AI Recommendation', message: 'Weights were updated by Admin Kiran', time: '1h ago', read: false },
  { id: 'notif-3', title: 'Badge unlocked!', message: 'You earned the Milestone Rose badge 🌹', time: '4h ago', read: true }
];
