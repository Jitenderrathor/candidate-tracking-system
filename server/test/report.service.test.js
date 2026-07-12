process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildMatch,
  candidateListPipeline,
  createReportService,
  monthlyPipeline,
  pipelineReportPipeline,
  sourcePipeline,
  statusPipeline,
  summaryPipeline,
} = require('../src/modules/reports/report.service');

test('report filters combine status, source, demographics, ranges, dates, and search', () => {
  const match = buildMatch({
    status: 'Selected',
    source: 'LinkedIn',
    gender: 'Female',
    qualification: 'B.Tech',
    minExperience: 3,
    maxExperience: 8,
    minCurrentCTC: 500000,
    maxCurrentCTC: 1000000,
    minExpectedCTC: 700000,
    maxExpectedCTC: 1400000,
    dateFrom: '2026-01-01',
    dateTo: '2026-07-31',
    search: 'Asha Sharma',
  });

  assert.equal(match.isDeleted, false);
  assert.equal(match.status, 'Selected');
  assert.equal(match.source, 'LinkedIn');
  assert.equal(match.gender, 'Female');
  assert.ok(match.qualification.test('b.tech'));
  assert.deepEqual(match.experienceYears, { $gte: 3, $lte: 8 });
  assert.deepEqual(match.currentCTC, { $gte: 500000, $lte: 1000000 });
  assert.deepEqual(match.expectedCTC, { $gte: 700000, $lte: 1400000 });
  assert.ok(match.createdAt.$gte instanceof Date);
  assert.equal(match.$or.length, 6);
  assert.ok(match.$or[5].$expr.$regexMatch.input.$concat);
});

test('candidate report uses requested sorting and default 20-row pagination', () => {
  const newest = candidateListPipeline({ page: 2 });
  const byName = candidateListPipeline({ sort: 'name' });

  assert.deepEqual(newest[1].$facet.candidates[0], { $sort: { createdAt: -1, _id: -1 } });
  assert.deepEqual(newest[1].$facet.candidates[1], { $skip: 20 });
  assert.deepEqual(newest[1].$facet.candidates[2], { $limit: 20 });
  assert.deepEqual(byName[1].$facet.candidates[0].$sort, {
    firstName: 1, lastName: 1, _id: 1,
  });
});

test('candidate report service returns pagination metadata from aggregation output', async () => {
  const CandidateModel = {
    async aggregate() {
      return [{ candidates: [{ candidateId: 'CRTS000001' }], total: 45 }];
    },
  };
  const service = createReportService({ CandidateModel });
  const result = await service.getCandidates({ page: 2, limit: 20 });

  assert.equal(result.candidates.length, 1);
  assert.deepEqual(result.meta, {
    total: 45, totalPages: 3, currentPage: 2, pageSize: 20,
  });
});

test('status and source pipelines return every configured category', () => {
  const statuses = statusPipeline({});
  const sources = sourcePipeline({});

  assert.deepEqual(statuses[0], { $match: { isDeleted: false } });
  assert.equal(statuses[2].$project.statusSummary.$arrayToObject.$map.input.length, 5);
  assert.equal(sources[2].$project.sourceSummary.$arrayToObject.$map.input.length, 8);
});

test('monthly report groups UTC registrations and current selections', () => {
  const pipeline = monthlyPipeline({ dateFrom: '2026-01-01' });
  const group = pipeline[1].$group;

  assert.equal(group._id.$dateToString.format, '%Y-%m');
  assert.equal(group.registrations.$sum, 1);
  assert.deepEqual(group.selections.$sum.$cond[0], { $eq: ['$status', 'Selected'] });
  assert.deepEqual(pipeline[2], { $sort: { _id: 1 } });
});

test('pipeline report calculates selected-to-total conversion inside MongoDB', () => {
  const pipeline = pipelineReportPipeline({});
  const conversion = pipeline[3].$set.conversionPercentage;

  assert.deepEqual(conversion.$cond[0], { $gt: ['$total', 0] });
  assert.deepEqual(
    conversion.$cond[1].$round[0].$multiply[0].$divide,
    ['$pipeline.Selected', '$total'],
  );
});

test('summary report is a single faceted aggregation', () => {
  const pipeline = summaryPipeline({ source: 'Website' });
  assert.equal(pipeline[0].$match.source, 'Website');
  assert.ok(pipeline[1].$facet.overview);
  assert.ok(pipeline[1].$facet.statusCounts);
  assert.ok(pipeline[1].$facet.sourceCounts);
});
