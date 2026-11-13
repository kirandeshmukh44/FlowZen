const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({

    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: true
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    commentText: {
        type: String,
        required: true,
        trim: true
    },

    parentCommentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },

    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    }
},
    { timestamps: true }
);

commentSchema.index({ companyId: 1, taskId: 1 });

const comment = mongoose.model('Comment', commentSchema);
module.exports = comment;
