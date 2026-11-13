const mongoose = require('mongoose');

const taskassignmentSchema = new mongoose.Schema({
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: true
    },

    assignmentId: {
        type: String,
        unique: true,
    },

    assignedOn: {
        type: Date,
        default: Date.now
    },

    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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

taskassignmentSchema.index({ companyId: 1, taskId: 1 });
taskassignmentSchema.index({ companyId: 1, employeeId: 1 });

const TaskAssignment = mongoose.model('TaskAssignment', taskassignmentSchema);

module.exports = TaskAssignment;