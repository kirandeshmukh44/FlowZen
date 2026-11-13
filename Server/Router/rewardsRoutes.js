const express = require('express');
const { getMyRewards, getLeaderboard } = require('../Controllers/rewardsController');
const { protect } = require('../Middleware/authMiddleware');

const router = express.Router();

router.get('/me', protect, getMyRewards);
router.get('/leaderboard', protect, getLeaderboard);

module.exports = router;
