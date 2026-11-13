const mongoose = require('mongoose');

const taskUpdateSchema = new mongoose.Schema(
    {
        taskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task',
            required: true
        },

        updateId: {
            type: String,
            unique: true,
        },

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        progressNote: {
            type: String,
            trim: true,
            default: ''
        },

        newStatus: {
            type: String,
            enum: ['Pending', 'In Progress', 'Completed', 'On Hold', 'Cancelled', 'Review'],
            default: 'Pending',
            required: true
        },

        updatedOn: {
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

taskUpdateSchema.index({ companyId: 1, taskId: 1 });

const TaskUpdate = mongoose.model('TaskUpdate', taskUpdateSchema);

module.exports = TaskUpdate;