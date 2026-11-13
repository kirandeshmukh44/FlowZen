const User = require('../Models/User');
const TaskAssignment = require('../Models/TaskAssignment');

const XP_BASE = 50;
const XP_PRIORITY_BONUS = 20;   // High or Critical priority
const XP_ONTIME_BONUS = 20;      // completedAt <= deadline

// Badge catalogue — granted automatically when criteria are met.
const BADGES = [
    {
        badgeId: 'first-completion',
        name: 'First Victory',
        icon: '🏅',
        test: (u) => u.completedTasks >= 1
    },
    {
        badgeId: 'task-streak-7',
        name: 'Zen Streak',
        icon: '🔥',
        test: (u) => u.taskStreak >= 7
    },
    {
        badgeId: 'task-master',
        name: 'Task Master',
        icon: '👑',
        test: (u) => u.completedTasks >= 10
    },
    {
        badgeId: 'rising-star',
        name: 'Rising Star',
        icon: '⭐',
        test: (u) => u.xp >= 1000
    }
];

// Named levels per spec: Beginner 0, Intermediate 500, Advanced 1500, Elite 2500.
const LEVELS = [
    { name: 'Beginner', minXp: 0 },
    { name: 'Intermediate', minXp: 500 },
    { name: 'Advanced', minXp: 1500 },
    { name: 'Elite', minXp: 2500 }
];

const levelInfoForXp = (xp) => {
    const value = xp || 0;
    let idx = 0;
    for (let i = 0; i < LEVELS.length; i++) {
        if (value >= LEVELS[i].minXp) idx = i;
    }
    const current = LEVELS[idx];
    const next = LEVELS[idx + 1] || null;
    return {
        level: idx + 1,
        name: current.name,
        xp: value,
        nextLevelName: next ? next.name : null,
        nextLevelAt: next ? next.minXp : null,
        progressToNext: next
            ? Math.min(100, Math.round(((value - current.minXp) / (next.minXp - current.minXp)) * 100))
            : 100
    };
};

// Back-compat: numeric level used by older UI code.
const levelForXp = (xp) => levelInfoForXp(xp).level;

const todayKey = (d = new Date()) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const dayDiff = (aKey, bKey) => {
    const [ay, am, ad] = aKey.split('-').map(Number);
    const [by, bm, bd] = bKey.split('-').map(Number);
    return Math.round((Date.UTC(ay, am - 1, ad) - Date.UTC(by, bm - 1, bd)) / 86400000);
};

// Award completion XP to every assignee of an approved task.
// Idempotent: skips entirely when task.xpAwarded is already true and sets
// it true after a successful award. Streak counts consecutive days with an
// approved completion (yesterday -> streak+1, today -> unchanged, gap -> 1).
const grantCompletionRewards = async ({ companyId, taskId, approvedBy }) => {
    const Task = require('../Models/Task');
    const task = await Task.findOne({ _id: taskId, companyId }).select('xpAwarded priority completedAt deadline');
    if (!task || task.xpAwarded) return [];

    const assignments = await TaskAssignment.find({ taskId, companyId }).select('employeeId');
    const results = [];
    const today = todayKey();
    const isHighPriority = ['High', 'Critical'].includes(task.priority);
    const doneAt = task.completedAt ? new Date(task.completedAt) : new Date();
    const onTime = task.deadline ? doneAt.getTime() <= new Date(task.deadline).getTime() : false;
    const xpGain = XP_BASE + (isHighPriority ? XP_PRIORITY_BONUS : 0) + (onTime ? XP_ONTIME_BONUS : 0);

    for (const a of assignments) {
        const user = await User.findOne({
            _id: a.employeeId,
            companyId,
            accountStatus: 'Active'
        });
        if (!user) continue;

        user.xp = (user.xp || 0) + xpGain;
        user.completedTasks = (user.completedTasks || 0) + 1;

        // Consecutive-day streak on approval date
        const last = user.lastApprovedDate;
        if (!last) {
            user.taskStreak = 1;
        } else {
            const diff = dayDiff(today, last);
            user.taskStreak = diff === 1 ? (user.taskStreak || 0) + 1 : diff === 0 ? (user.taskStreak || 0) : 1;
        }
        user.lastApprovedDate = today;

        const existingBadgeIds = new Set((user.badges || []).map((b) => b.badgeId));
        const newBadges = [];
        for (const badge of BADGES) {
            if (!existingBadgeIds.has(badge.badgeId) && badge.test(user)) {
                user.badges.push({
                    badgeId: badge.badgeId,
                    name: badge.name,
                    icon: badge.icon,
                    unlockedAt: new Date()
                });
                newBadges.push({ badgeId: badge.badgeId, name: badge.name, icon: badge.icon });
            }
        }

        await user.save();
        results.push({
            userId: user._id,
            xp: user.xp,
            level: levelForXp(user.xp),
            levelName: levelInfoForXp(user.xp).name,
            completedTasks: user.completedTasks,
            taskStreak: user.taskStreak,
            xpGained: xpGain,
            newBadges
        });
    }

    if (results.length) {
        task.xpAwarded = true;
        await task.save();
    }
    return results;
};

// Scope a leaderboard query for the requesting user.
// Admin -> everyone. Manager -> self + employees with managerId=me.
// Employee -> self + own manager (+ sibling employees of same manager? spec:
// "Employee their team and manager" -> employees sharing my manager + manager).
const leaderboardScopeFilter = async (reqUser) => {
    const User = require('../Models/User');
    if (reqUser.role === 'Admin') return { companyId: reqUser.companyId };
    if (reqUser.role === 'Manager') {
        return {
            companyId: reqUser.companyId,
            $or: [{ _id: reqUser._id }, { managerId: reqUser._id }]
        };
    }
    // Employee: self + manager + teammates under same manager
    const me = await User.findById(reqUser._id).select('managerId');
    const or = [{ _id: reqUser._id }];
    if (me?.managerId) {
        or.push({ _id: me.managerId }, { managerId: me.managerId });
    } else if (me?.createdBy) {
        or.push({ _id: me.createdBy }, { createdBy: me.createdBy });
    }
    return { companyId: reqUser.companyId, $or: or };
};

module.exports = {
    grantCompletionRewards,
    levelForXp,
    levelInfoForXp,
    LEVELS,
    XP_BASE,
    XP_PRIORITY_BONUS,
    XP_ONTIME_BONUS,
    BADGES,
    leaderboardScopeFilter
};
