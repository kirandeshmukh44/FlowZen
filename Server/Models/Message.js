const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true
        },

        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Conversation',
            required: true
        },

        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000
        }
    },
    { timestamps: true }
);

messageSchema.index({ companyId: 1, conversationId: 1, createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
