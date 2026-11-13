const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  channel: { type: String, required: true, trim: true, default: 'general' },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
}, { timestamps: true });

chatMessageSchema.index({ companyId: 1, channel: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
