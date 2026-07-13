const mongoose = require('mongoose');
const { CANDIDATE_STATUSES } = require('../candidates/candidate.constants');

const statusHistorySchema = new mongoose.Schema({
  candidateId: { type: String, required: true, index: true },
  candidateObjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true,
  },
  oldStatus: { type: String, required: true, enum: CANDIDATE_STATUSES },
  newStatus: { type: String, required: true, enum: CANDIDATE_STATUSES },
  remarks: { type: String, trim: true, default: '', maxlength: 2000 },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  changedAt: { type: Date, required: true, default: Date.now, index: true },
  ipAddress: { type: String, required: true, trim: true, maxlength: 100 },
  userAgent: { type: String, required: true, trim: true, maxlength: 1000 },
}, { timestamps: true });

statusHistorySchema.index({ candidateObjectId: 1, changedAt: -1 });

module.exports = mongoose.models.StatusHistory
  || mongoose.model('StatusHistory', statusHistorySchema);
