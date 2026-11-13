
const mongoose = require('mongoose');

const aiSuggestionSchema = new mongoose.Schema(
    {
        suggestionId: {
            type: String,
            unique: true
        },
        taskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task',
            required: true
        },
        suggestionText: {
            type: String,
            required: true,
            trim: true
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
    { timestamps: true }
);

aiSuggestionSchema.index({ companyId: 1, taskId: 1 });

const AISuggestion = mongoose.model(
    'AISuggestion',
    aiSuggestionSchema
);

module.exports = AISuggestion;
