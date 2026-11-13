const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120
        }
    },
    { timestamps: true }
);

companySchema.index({ name: 1 });

const Company = mongoose.model('Company', companySchema);
module.exports = Company;
