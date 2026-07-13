process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createStatusWorkflowService,
  validateTransition,
} = require('../src/modules/status-workflow/statusWorkflow.service');

const makeHarness = ({ initialStatus = 'Registered', recruitmentStatus, failActivity = false } = {}) => {
  const candidate = {
    _id: '000000000000000000000001',
    candidateId: 'CRTS000001',
    status: initialStatus,
    recruitmentStatus,
    updatedBy: 'original-user',
    async save(options) { this.savedWithSession = options.session; return this; },
  };
  const histories = [];
  const activities = [];
  const session = {
    ended: false,
    async withTransaction(work) {
      const snapshot = {
        status: candidate.status,
        recruitmentStatus: candidate.recruitmentStatus,
        updatedBy: candidate.updatedBy,
      };
      const historyLength = histories.length;
      const activityLength = activities.length;
      try {
        return await work();
      } catch (error) {
        candidate.status = snapshot.status;
        candidate.recruitmentStatus = snapshot.recruitmentStatus;
        candidate.updatedBy = snapshot.updatedBy;
        histories.splice(historyLength);
        activities.splice(activityLength);
        throw error;
      }
    },
    async endSession() { this.ended = true; },
  };
  const query = (value) => ({
    session: async (receivedSession) => {
      assert.equal(receivedSession, session);
      return value;
    },
    select: async () => value,
  });
  const CandidateModel = { findOne: () => query(candidate) };
  const StatusHistoryModel = {
    async create(documents, options) {
      assert.equal(options.session, session);
      const history = { _id: 'history-1', ...documents[0] };
      histories.push(history);
      return [history];
    },
    find(filter) {
      let result = histories.filter((item) => item.candidateObjectId === filter.candidateObjectId);
      return {
        sort() {
          result = result.sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt));
          return this;
        },
        populate() { return this; },
        lean() { return Promise.resolve(result); },
      };
    },
  };
  const auditService = {
    async logCandidateStatusChange(event, receivedSession) {
      assert.equal(receivedSession, session);
      if (failActivity) throw new Error('activity insert failed');
      activities.push(event);
    },
  };
  const service = createStatusWorkflowService({
    CandidateModel,
    StatusHistoryModel,
    auditService,
    startSession: async () => session,
  });
  const change = (newStatus, role = 'User', remarks = '') => service.changeStatus({
    candidateId: 'CRTS000001',
    newStatus,
    remarks,
    actor: { id: 'actor-1', role },
    requestContext: { ipAddress: '127.0.0.1', userAgent: 'Test Browser' },
  });
  return { activities, candidate, change, histories, service, session };
};

test('valid forward transition updates candidate and creates history and activity', async () => {
  const harness = makeHarness();
  const result = await harness.change('Under Consideration', 'User', 'HR review');

  assert.equal(harness.candidate.status, 'Under Consideration');
  assert.equal(harness.candidate.updatedBy, 'actor-1');
  assert.equal(harness.histories.length, 1);
  assert.equal(harness.histories[0].oldStatus, 'Registered');
  assert.equal(harness.activities.length, 1);
  assert.equal(harness.activities[0].newStatus, 'Under Consideration');
  assert.equal(result.history._id, 'history-1');
  assert.equal(harness.session.ended, true);
});

test('status transition keeps imported recruitment status in sync', async () => {
  const harness = makeHarness({ recruitmentStatus: 'Registered' });
  await harness.change('Under Consideration', 'User', 'HR review');

  assert.equal(harness.candidate.status, 'Under Consideration');
  assert.equal(harness.candidate.recruitmentStatus, 'Under Consideration');
});

test('invalid transition is rejected without audit writes', async () => {
  const harness = makeHarness();
  harness.candidate.status = 'Under Consideration';
  await assert.rejects(() => harness.change('Registered'), { code: 'ADMIN_REQUIRED_FOR_BACKWARD_TRANSITION' });
  assert.equal(harness.candidate.status, 'Under Consideration');
  assert.equal(harness.histories.length, 0);
  assert.equal(harness.activities.length, 0);
});

test('selected candidate rollback requires Admin and remarks', async () => {
  assert.throws(() => validateTransition({
    oldStatus: 'Selected', newStatus: 'Under Consideration', role: 'User', remarks: 'Review',
  }), { code: 'ADMIN_REQUIRED_FOR_BACKWARD_TRANSITION' });
  assert.throws(() => validateTransition({
    oldStatus: 'Selected', newStatus: 'Under Consideration', role: 'Admin', remarks: '',
  }), { code: 'BACKWARD_REMARKS_REQUIRED' });

  const harness = makeHarness({ initialStatus: 'Selected' });
  await harness.change('Under Consideration', 'Admin', 'Offer withdrawn for review');
  assert.equal(harness.candidate.status, 'Under Consideration');
});

test('transaction rolls candidate and history back when activity insert fails', async () => {
  const harness = makeHarness({ failActivity: true });
  await assert.rejects(() => harness.change('Under Consideration', 'User', 'Review'), {
    message: 'activity insert failed',
  });
  assert.equal(harness.candidate.status, 'Registered');
  assert.equal(harness.histories.length, 0);
  assert.equal(harness.activities.length, 0);
  assert.equal(harness.session.ended, true);
});

test('status history is returned newest first', async () => {
  const harness = makeHarness();
  harness.histories.push(
    { candidateObjectId: harness.candidate._id, changedAt: new Date('2026-01-01'), newStatus: 'Under Consideration' },
    { candidateObjectId: harness.candidate._id, changedAt: new Date('2026-02-01'), newStatus: 'To Be Shortlisted' },
  );

  const history = await harness.service.getHistory('CRTS000001');
  assert.equal(history.length, 2);
  assert.equal(history[0].newStatus, 'To Be Shortlisted');
});
