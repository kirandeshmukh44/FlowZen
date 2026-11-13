const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        notificationId: {
            type: String,
            unique: true
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        message: {
            type: String,
            required: true,
            trim: true
        },

        notificationType: {
            type: String,
            enum: [
                'Task Assigned',
                'Task Updated',
                'Deadline Reminder',
                'Task Completed',
                'General'
            ],
            default: 'General'
        },

        isRead: {
            type: Boolean,
            default: false
        },

        createdOn: {
            type: Date,
            default: Date.now
        },

        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true
        }
    },
    {
        timestamps: true
    }
);

notificationSchema.index({ companyId: 1, userId: 1, createdAt: -1 });

const Notification = mongoose.model(
    'Notification',
    notificationSchema
);

module.exports = Notification;
