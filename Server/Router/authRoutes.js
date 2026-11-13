
const express = require('express');

const { loginUser, changePassword, registerCompany } = require('../Controllers/authController');
const { protect } = require('../Middleware/authMiddleware');
const { schemas, validate } = require('../utils/validate');
const { authLimiter, loginLimiter } = require('../Middleware/rateLimit');

const router = express.Router();

// Public self-registration removed (Phase 2). Company admins are created
// via register-company; other users via POST /api/users by Admin/Manager.
router.post('/register-company', authLimiter, validate(schemas.registerCompany), registerCompany);
router.post('/login', loginLimiter, validate(schemas.login), loginUser);
router.post('/change-password', protect, authLimiter, validate(schemas.changePassword), changePassword);

module.exports = router;
