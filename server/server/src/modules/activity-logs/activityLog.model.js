const mongoose = require('mongoose');
const { CANDIDATE_STATUSES } = require('../candidates/candidate.constants');

const activityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', default: null, index: true },
  candidateId: { type: String, default: null, index: true },
  action: {
    type: String,
    required: true,
    enum: ['CANDIDATE_STATUS_CHANGED', 'EXCEL_IMPORT_STARTED', 'EXCEL_IMPORT_COMPLETED'],
  },
  oldStatus: { type: String, enum: CANDIDATE_STATUSES, default: null },
  newStatus: { type: String, enum: CANDIDATE_STATUSES, default: null },
  importedCount: { type: Number, min: 0, default: null },
  skippedCount: { type: Number, min: 0, default: null },
  fileName: { type: String, trim: true, maxlength: 255, default: null },
  occurredAt: { type: Date, required: true, default: Date.now, index: true },
  ipAddress: { type: String, required: true, trim: true, maxlength: 100 },
  userAgent: { type: String, required: true, trim: true, maxlength: 1000 },
}, { timestamps: true });

activityLogSchema.index({ candidate: 1, occurredAt: -1 });
activityLogSchema.index({ action: 1, occurredAt: -1 });

activityLogSchema.pre('validate', function validateActionFields(next) {
  if (this.action === 'CANDIDATE_STATUS_CHANGED'
    && (!this.candidate || !this.candidateId || !this.oldStatus || !this.newStatus)) {
    return next(new Error('Candidate status activity requires candidate and status details'));
  }
  if (this.action === 'EXCEL_IMPORT_COMPLETED'
    && (this.importedCount === null || this.skippedCount === null)) {
    return next(new Error('Completed Excel import activity requires import counts'));
  }
  return next();
});

module.exports = mongoose.models.ActivityLog
  || mongoose.model('ActivityLog', activityLogSchema);
