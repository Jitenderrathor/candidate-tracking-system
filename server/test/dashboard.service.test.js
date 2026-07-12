process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  countsPipeline,
  createDashboardService,
  genderSummaryPipeline,
  monthlyTrendPipeline,
  recentCandidatesPipeline,
  sourceSummaryPipeline,
  statusSummaryPipeline,
} = require('../src/modules/dashboard/dashboard.service');

const STATUS_SUMMARY = {
  Registered: 5,
  'Under Consideration': 3,
  'To Be Shortlisted': 1,
  Selected: 1,
};
const SOURCE_SUMMARY = {
  Website: 2,
  Referral: 2,
  'Job Portal': 1,
  'Walk-in': 1,
  LinkedIn: 2,
  Facebook: 0,
  Instagram: 1,
  Other: 1,
};
const GENDER_SUMMARY = { Male: 4, Female: 3, 'Unknown / Not Specified': 3 };
const MONTHLY_TREND = Array.from({ length: 12 }, (_, index) => ({
  month: `month-${index + 1}`,
  registrationCount: index,
}));
const RECENT = [{
  candidateId: 'CRTS000012',
  name: 'Asha Sharma',
  source: 'LinkedIn',
  status: 'Registered',
  createdAt: new Date('2026-07-11'),
}];

const fakeCandidateModel = {
  async aggregate(pipeline) {
    const serialized = JSON.stringify(pipeline);
    if (serialized.includes('totalCandidates')) return [{ totalCandidates: 12, activeCandidates: 10 }];
    if (serialized.includes('statusSummary')) return [{ statusSummary: STATUS_SUMMARY }];
    if (serialized.includes('sourceSummary')) return [{ sourceSummary: SOURCE_SUMMARY }];
    if (serialized.includes('genderSummary')) return [{ genderSummary: GENDER_SUMMARY }];
    if (serialized.includes('monthlyTrend')) return [{ monthlyTrend: MONTHLY_TREND }];
    return RECENT;
  },
};

test('dashboard summary composes all aggregation results', async () => {
  const service = createDashboardService({
    CandidateModel: fakeCandidateModel,
    now: () => new Date('2026-07-11T00:00:00.000Z'),
  });
  const summary = await service.getSummary();

  assert.equal(summary.totalCandidates, 12);
  assert.equal(summary.activeCandidates, 10);
  assert.deepEqual(summary.statusSummary, STATUS_SUMMARY);
  assert.deepEqual(summary.sourceSummary, SOURCE_SUMMARY);
  assert.deepEqual(summary.genderSummary, GENDER_SUMMARY);
  assert.equal(summary.monthlyTrend.length, 12);
  assert.deepEqual(summary.recentCandidates, RECENT);
});

test('count pipeline distinguishes all registrations from active candidates', () => {
  const pipeline = countsPipeline();
  assert.equal(pipeline[0].$group.totalCandidates.$sum, 1);
  assert.deepEqual(
    pipeline[0].$group.activeCandidates.$sum.$cond[0],
    { $eq: ['$isDeleted', false] },
  );
});

test('status, source, and gender pipelines filter deleted records and fill fixed categories', () => {
  const statusPipeline = statusSummaryPipeline();
  const sourcePipeline = sourceSummaryPipeline();
  const genderPipeline = genderSummaryPipeline();

  assert.deepEqual(statusPipeline[0], { $match: { isDeleted: false } });
  assert.deepEqual(sourcePipeline[0], { $match: { isDeleted: false } });
  assert.deepEqual(genderPipeline[0], { $match: { isDeleted: false } });
  assert.equal(statusPipeline[2].$project.statusSummary.$arrayToObject.$map.input.length, 5);
  assert.equal(sourcePipeline[2].$project.sourceSummary.$arrayToObject.$map.input.length, 8);
  assert.equal(genderPipeline[2].$project.genderSummary.$arrayToObject.$map.input.length, 3);
  assert.equal(
    genderPipeline[1].$facet.counts[0].$group._id.$switch.default,
    'Unknown / Not Specified',
  );
});

test('monthly pipeline covers exactly the last 12 UTC calendar months and zero-fills in MongoDB', () => {
  const pipeline = monthlyTrendPipeline(new Date('2026-07-11T00:00:00.000Z'));
  assert.deepEqual(pipeline[0].$match.createdAt, {
    $gte: new Date('2025-08-01T00:00:00.000Z'),
    $lt: new Date('2026-08-01T00:00:00.000Z'),
  });
  assert.deepEqual(pipeline[2].$project.monthlyTrend.$map.input, { $range: [0, 12] });
  assert.equal(pipeline[1].$facet.counts[0].$group.count.$sum, 1);
});

test('recent pipeline excludes deleted candidates, orders newest first, limits ten, and projects safe fields', () => {
  const pipeline = recentCandidatesPipeline();
  assert.deepEqual(pipeline[0], { $match: { isDeleted: false } });
  assert.deepEqual(pipeline[1], { $sort: { createdAt: -1, _id: -1 } });
  assert.deepEqual(pipeline[2], { $limit: 10 });
  assert.equal(pipeline[3].$project.email, undefined);
  assert.ok(pipeline[3].$project.name.$trim);
});
