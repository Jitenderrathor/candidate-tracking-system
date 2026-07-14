const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  smtpFromName: {
    type: String,
    trim: true,
    maxlength: 100,
    default: 'Candidate Tracking System',
  },
  smtpFromEmail: {
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 254,
    default: 'noreply@example.com',
  },
  defaultCc: {
    type: String,
    trim: true,
    default: '',
  },
  defaultBcc: {
    type: String,
    trim: true,
    default: '',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  smtpHost: {
    type: String,
    trim: true,
  },
  smtpPort: {
    type: Number,
  },
  smtpUser: {
    type: String,
    trim: true,
  },
  smtpPass: {
    type: String,
  },
  history: [{
    action: { type: String, required: true },
    smtpUser: { type: String, trim: true },
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],
}, { timestamps: true });

// Ensure only one document is created
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    // Requires a user to set it up eventually, but we can't create it without updatedBy.
    // The controller should handle initialization if it doesn't exist.
    return null;
  }
  return settings;
};

module.exports = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);
