const express = require('express');

const {
    createSuggestion,
    getTaskSuggestions
} = require('../Controllers/aiSuggestionController');

const router = express.Router();
const { protect, authorizeRoles } = require('../Middleware/authMiddleware');

router.post('/', protect, authorizeRoles('Admin', 'Manager'), createSuggestion);
router.get('/task/:taskId', protect, getTaskSuggestions);

module.exports = router;
