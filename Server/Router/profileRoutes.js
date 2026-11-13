const express = require('express');
const router = express.Router();
const { protect } = require('../Middleware/authMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');
const { getProfile, uploadProfilePhoto, removeProfilePhoto } = require('../Controllers/profileController');

// All profile routes require authentication
router.use(protect);

// GET /api/users/profile - Get current user's profile
router.get('/profile', getProfile);

// POST /api/users/profile/photo - Upload/update profile photo
router.post('/profile/photo', uploadMiddleware, uploadProfilePhoto);

// DELETE /api/users/profile/photo - Remove profile photo
router.delete('/profile/photo', removeProfilePhoto);

module.exports = router;
