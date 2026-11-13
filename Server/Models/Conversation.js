const mongoose = require('mongoose');

// Conversation types:
//  - 'dm'   : 1:1 chat between two company members (employee <-> manager/admin)
//  - 'task' : discussion thread for a task; only created when the task has
//             2+ assignees. One thread per task per company.
const conversationSchema = new mongoose.Schema(
    {
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true
        },

        type: {
            type: String,
            enum: ['dm', 'task', 'general'],
            required: true
        },

        participantIds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }],

        // Only for type 'task'
        taskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task',
            default: null
        },

        lastMessageAt: {
            type: Date,
            default: Date.now
        },

        // Per-participant read markers for unread badges.
        // { userId, lastReadAt } — absent entry means never read.
        readMarkers: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            lastReadAt: {
                type: Date,
                default: Date.now
            }
        }]
    },
    { timestamps: true }
);

conversationSchema.index({ companyId: 1, type: 1 });
conversationSchema.index({ companyId: 1, taskId: 1 });
conversationSchema.index({ participantIds: 1 });

const Conversation = mongoose.model('Conversation', conversationSchema);
module.exports = Conversation;
