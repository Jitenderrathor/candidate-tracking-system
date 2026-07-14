const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  subject: { type: String, required: true, trim: true },
  htmlBody: { type: String, required: true },
  variables: { type: [String], default: [] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.models.EmailTemplate || mongoose.model('EmailTemplate', emailTemplateSchema);
