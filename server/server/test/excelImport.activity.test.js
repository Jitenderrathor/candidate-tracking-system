process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const ActivityLog = require('../src/modules/activity-logs/activityLog.model');

test('ActivityLog model validates completed Excel import counts', async () => {
  const activity = new ActivityLog({
    user: new mongoose.Types.ObjectId(),
    action: 'EXCEL_IMPORT_COMPLETED',
    importedCount: 98,
    skippedCount: 2,
    fileName: 'candidates.xlsx',
    ipAddress: '127.0.0.1',
    userAgent: 'Test Browser',
  });
  await activity.validate();
  assert.equal(activity.importedCount, 98);
  assert.equal(activity.skippedCount, 2);
});
