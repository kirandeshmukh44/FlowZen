const User = require('../Models/User');
const cloudinary = require('../config/cloudinary');

// GET /api/users/profile
// Get the current authenticated user's profile
const getProfile = async (req, res) => {
    try {
        // req.user is set by the 'protect' middleware
        const user = await User.findById(req.user._id)
            .select('-passwordHash')
            .lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        return res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                accountStatus: user.accountStatus,
                mustChangePassword: user.mustChangePassword,
                profilePhoto: user.profilePhoto,
                xp: user.xp,
                completedTasks: user.completedTasks,
                taskStreak: user.taskStreak,
                badges: user.badges,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Get profile error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// POST /api/users/profile/photo
// Upload or update profile photo
const uploadProfilePhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Store the old publicId for deletion after successful upload
        const oldPublicId = user.profilePhoto?.publicId || null;

        // Upload the new image to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder: 'flowzen/profile-photos',
                    public_id: `${user._id}_profile`, // Use user ID to ensure uniqueness
                    overwrite: true,
                    transformation: [
                        { width: 300, height: 300, crop: 'fill', gravity: 'face' },
                        { quality: 'auto', fetch_format: 'auto' }
                    ]
                },
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            ).end(req.file.buffer);
        });

        // Update the user document with the new photo details
        user.profilePhoto = {
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id
        };
        await user.save();

        // Delete the old photo from Cloudinary if it existed
        if (oldPublicId) {
            try {
                await cloudinary.uploader.destroy(oldPublicId);
            } catch (deleteError) {
                console.error('Failed to delete old photo from Cloudinary:', deleteError.message);
                // Don't fail the request if deletion fails
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Profile photo uploaded successfully',
            profilePhoto: user.profilePhoto
        });
    } catch (error) {
        console.error('Upload profile photo error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to upload profile photo'
        });
    }
};

// DELETE /api/users/profile/photo
// Remove profile photo
const removeProfilePhoto = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const oldPublicId = user.profilePhoto?.publicId || null;

        // Remove photo from user document
        user.profilePhoto = {
            url: null,
            publicId: null
        };
        await user.save();

        // Delete the photo from Cloudinary if it existed
        if (oldPublicId) {
            try {
                await cloudinary.uploader.destroy(oldPublicId);
            } catch (deleteError) {
                console.error('Failed to delete photo from Cloudinary:', deleteError.message);
                // Don't fail the request if deletion fails
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Profile photo removed successfully'
        });
    } catch (error) {
        console.error('Remove profile photo error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to remove profile photo'
        });
    }
};

module.exports = {
    getProfile,
    uploadProfilePhoto,
    removeProfilePhoto
};
