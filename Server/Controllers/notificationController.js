const Notification = require('../Models/Notification');
const User = require('../Models/User');
const { isOwnEmployee } = require('../utils/taskScope');


const getNotifications = async (req, res) => {
    try{
        const { userId } = req.params;

        // Employees may only read their own notifications.
        if (
            req.user.role === 'Employee' &&
            userId !== req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: 'You can only view your own notifications.'
            });
        }

        const user = await User.findOne({ _id: userId, companyId: req.user.companyId });

        if(!user){
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Managers may read only their own or their Employees' notifications.
        if (req.user.role === 'Manager') {
            const allowed = userId === req.user._id.toString() || isOwnEmployee(req.user, user);
            if (!allowed) {
                return res.status(403).json({
                    success: false,
                    message: 'Managers can only view notifications of themselves or their own Employees'
                });
            }
        }

        // Manager may notify only themselves or Employees they created.
        if (req.user.role === 'Manager') {
            const allowed = user._id.toString() === req.user._id.toString() || isOwnEmployee(req.user, user);
            if (!allowed) {
                return res.status(403).json({
                    success: false,
                    message: 'Managers can only notify themselves or their own Employees'
                });
            }
        }

        const notifications = await Notification.find({
            userId,
            companyId: req.user.companyId
        }).sort({ createdAt: -1});
        
        return res.status(200).json({
            success: true,
            count: notifications.length,
            notifications
        });
    }
    catch(error){
        console.error('Get notifications error:', error.message);

        if(error.name === 'CastError'){
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const markNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await Notification.findOne({
            _id: id,
            companyId: req.user.companyId
        }).select('userId');
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        // Only the owner (or Admin/Manager) may mark a notification read.
        const isOwner = existing.userId && existing.userId.toString() === req.user._id.toString();
        if (req.user.role === 'Employee' && !isOwner) {
            return res.status(403).json({
                success: false,
                message: 'You can only update your own notifications.'
            });
        }

        const notification = await Notification.findOneAndUpdate(
            { _id: id, companyId: req.user.companyId },
            { isRead: true },
            { new: true, runValidators: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Notification marked as read',
            notification
        });
    } catch (error) {
        console.error('Mark notification error:', error.message);

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid notification ID'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const createNotification = async (req, res) => {
    try {
        const {
            userId,
            message,
            notificationType
        } = req.body;

        if (!userId || !message) {
            return res.status(400).json({
                success: false,
                message: 'User ID and message are required'
            });
        }

        const user = await User.findOne({ _id: userId, companyId: req.user.companyId });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const validTypes = [
            'Task Assigned',
            'Task Updated',
            'Deadline Reminder',
            'Task Completed',
            'General'
        ];

        if (
            notificationType &&
            !validTypes.includes(notificationType)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid notification type'
            });
        }

        const notification = await Notification.create({
            notificationId: `NOT-${Date.now()}-${Math.random()
                .toString(36).slice(2, 8)}`,
            userId,
            companyId: req.user.companyId,
            message: message.trim(),
            notificationType: notificationType || 'General'
        });

        return res.status(201).json({
            success: true,
            message: 'Notification created successfully',
            notification
        });
    } catch (error) {
        console.error('Create notification error:', error.message);

        if (
            error.name === 'CastError' ||
            error.name === 'ValidationError'
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid notification data'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = { getNotifications, markNotificationAsRead, createNotification };
