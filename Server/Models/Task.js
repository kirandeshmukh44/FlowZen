const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title:{
        type: String,
        required: true,
        trim: true
    },

    description:{
        type: String,
        default: ''
    },

    priority:{
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium'
    },

    status:{
        type: String,
        enum: ['Pending', 'In Progress', 'Completed', 'On Hold', 'Cancelled', 'Review'],
        default: 'Pending'
    },

    // Phase 3: client-facing priority attributes (1-10) + categorization
    importance:{
        type: Number,
        min: 1,
        max: 10,
        default: null
    },

    urgency:{
        type: Number,
        min: 1,
        max: 10,
        default: null
    },

    effort:{
        type: Number,
        min: 1,
        max: 10,
        default: null
    },

    tags:{
        type: [String],
        default: []
    },

    category:{
        type: String,
        trim: true,
        default: ''
    },

    // Server-calculated AI priority score (same formula as the client).
    aiScore:{
        type: Number,
        min: 0,
        max: 100,
        default: null
    },

    // Phase 4: rewards are granted once per completion cycle, only when a
    // manager/admin approves (PUT /tasks/:id -> Completed or POST
    // /tasks/:id/approve). Employee PATCH completions leave this false
    // until approved. Reset when the task leaves 'Completed'.
    completionApproved:{
        type: Boolean,
        default: false
    },

    // Approval metadata — set when a task moves to 'Completed' via an
    // explicit approve action or a direct manager/admin status change.
    approvedBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    approvedAt:{
        type: Date,
        default: null
    },

    // Manager's note when sending a Review task back to In Progress.
    reviewNote:{
        type: String,
        trim: true,
        default: ''
    },

    // Idempotency guard: XP is awarded at most once per task.
    xpAwarded:{
        type: Boolean,
        default: false
    },

    completedAt:{
        type: Date,
        default: null
    },

    creationDate:{
        type: Date,
            default: Date.now
        },

    deadline:{
        type: Date,
        required: true
    },

    createdBy: {
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

taskSchema.index({ companyId: 1, createdAt: -1 });
taskSchema.index({ companyId: 1, status: 1 });
taskSchema.index({ companyId: 1, aiScore: -1 });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;