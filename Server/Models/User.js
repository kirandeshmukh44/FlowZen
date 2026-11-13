const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            // NOTE: uniqueness is enforced per-company via the compound
            // index below (added in Phase 2 migration). The standalone
            // unique index on email is dropped by the migration script.
            lowercase: true,
            trim: true
        },

        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true
        },

        passwordHash: {
            type: String,
            required: true
        },

        role: {
            type: String,
            required: true,
            enum: ['Admin', 'Manager', 'Employee']
        },

        accountStatus: {
            type: String,
            enum: ['Active', 'Inactive'],
            default: 'Active'
        },

        // Set when an Admin/Manager creates the user with a temp password.
        // Cleared by POST /api/auth/change-password.
        mustChangePassword: {
            type: Boolean,
            default: false
        },

        // Who created this user (Admin or Manager). Used for manager
        // scoping: a Manager only sees/deletes users they created.
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },

        // Direct manager for Employees (set on creation or via
        // PUT /users/:id/manager). Manager scoping uses this field.
        managerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },

        // Date (YYYY-MM-DD) of the last approved completion — drives the
        // consecutive-day streak calculation.
        lastApprovedDate: {
            type: String,
            default: null
        },

        // Phase 4: gamification/rewards (company-scoped, granted on
        // manager-approved task completion)
        xp: {
            type: Number,
            default: 0,
            min: 0
        },

        completedTasks: {
            type: Number,
            default: 0,
            min: 0
        },

        taskStreak: {
            type: Number,
            default: 0,
            min: 0
        },

        badges: [{
            badgeId: { type: String },
            name: { type: String },
            icon: { type: String },
            unlockedAt: { type: Date, default: Date.now }
        }],

        // Profile photo upload (Cloudinary)
        profilePhoto: {
            url: { type: String, default: null },
            publicId: { type: String, default: null }
        }
    },
    {
        timestamps: true
    }
);

userSchema.index({ role: 1, createdBy: 1 });
userSchema.index({ companyId: 1, email: 1 }, { unique: true });
userSchema.index({ companyId: 1, role: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;

