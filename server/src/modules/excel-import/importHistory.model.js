const mongoose = require('mongoose');

const importHistorySchema = new mongoose.Schema({
  fileName: { type: String, required: true, trim: true },
  importedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  totalRows: { type: Number, required: true, min: 0 },
  importedCount: { type: Number, required: true, min: 0 },
  skippedCount: { type: Number, required: true, min: 0 },
  duplicateMobiles: { type: Number, default: 0 },
  duplicateEmails: { type: Number, default: 0 },
  validationErrors: [{
    row: { type: Number, required: true },
    errors: [{ type: String, required: true }]
  }],
}, { timestamps: true });

importHistorySchema.index({ createdAt: -1 });
importHistorySchema.index({ importedBy: 1, createdAt: -1 });

module.exports = mongoose.models.ImportHistory || mongoose.model('ImportHistory', importHistorySchema);
