const User = require('../Models/User');
const { levelInfoForXp, leaderboardScopeFilter } = require('../utils/rewards');

const publicRewards = (u) => ({
    id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    xp: u.xp || 0,
    level: levelInfoForXp(u.xp || 0).level,
    levelName: levelInfoForXp(u.xp || 0).name,
    nextLevelName: levelInfoForXp(u.xp || 0).nextLevelName,
    nextLevelAt: levelInfoForXp(u.xp || 0).nextLevelAt,
    progressToNext: levelInfoForXp(u.xp || 0).progressToNext,
    completedTasks: u.completedTasks || 0,
    taskStreak: u.taskStreak || 0,
    badges: u.badges || []
});

// GET /api/rewards/me — current user's rewards
const getMyRewards = async (req, res) => {
    try {
        const user = await User.findOne({
            _id: req.user._id,
            companyId: req.user.companyId
        }).select('name email role xp completedTasks taskStreak badges');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        return res.status(200).json({ success: true, rewards: publicRewards(user) });
    } catch (error) {
        console.error('Get rewards error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// GET /api/rewards/leaderboard — scoped by role:
// Admin -> whole company; Manager -> self + own reports;
// Employee -> self + manager + teammates under same manager.
const getLeaderboard = async (req, res) => {
    try {
        const filter = await leaderboardScopeFilter(req.user);
        const users = await User.find({
            ...filter,
            accountStatus: 'Active'
        })
            .select('name email role xp completedTasks taskStreak badges')
            .sort({ xp: -1, completedTasks: -1 })
            .limit(50);

        return res.status(200).json({
            success: true,
            count: users.length,
            leaderboard: users.map((u, i) => ({ rank: i + 1, ...publicRewards(u) }))
        });
    } catch (error) {
        console.error('Leaderboard error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { getMyRewards, getLeaderboard };
