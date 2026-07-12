process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const StatusHistory = require('../src/modules/status-workflow/statusHistory.model');
const ActivityLog = require('../src/modules/activity-logs/activityLog.model');

const ids = () => ({
  candidateObjectId: new mongoose.Types.ObjectId(),
  userId: new mongoose.Types.ObjectId(),
});

test('StatusHistory model validates a complete audit record', async () => {
  const { candidateObjectId, userId } = ids();
  const history = new StatusHistory({
    candidateId: 'CRTS000001',
    candidateObjectId,
    oldStatus: 'Registered',
    newStatus: 'Under Consideration',
    remarks: 'HR screening started',
    changedBy: userId,
    ipAddress: '127.0.0.1',
    userAgent: 'Test Browser',
  });
  await history.validate();
  assert.ok(history.changedAt instanceof Date);
});

test('ActivityLog model validates candidate status audit details', async () => {
  const { candidateObjectId, userId } = ids();
  const activity = new ActivityLog({
    user: userId,
    candidate: candidateObjectId,
    candidateId: 'CRTS000001',
    action: 'CANDIDATE_STATUS_CHANGED',
    oldStatus: 'Registered',
    newStatus: 'Under Consideration',
    ipAddress: '127.0.0.1',
    userAgent: 'Test Browser',
  });
  await activity.validate();
  assert.ok(activity.occurredAt instanceof Date);
});
