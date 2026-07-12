const Candidate = require('../candidates/candidate.model');
const { escapeRegex, executeAggregation } = require('../../common/utils/mongoQuery');
const {
  CANDIDATE_SOURCES,
  CANDIDATE_STATUSES,
} = require('../candidates/candidate.constants');

const addRange = (match, field, minimum, maximum) => {
  if (minimum === undefined && maximum === undefined) return;
  match[field] = {};
  if (minimum !== undefined) match[field].$gte = Number(minimum);
  if (maximum !== undefined) match[field].$lte = Number(maximum);
};

const buildMatch = (filters = {}) => {
  const match = { isDeleted: false };
  if (filters.status) match.status = filters.status;
  if (filters.source) match.source = filters.source;
  if (filters.gender) match.gender = filters.gender;
  if (filters.qualification) {
    match.qualification = new RegExp(`^${escapeRegex(filters.qualification)}$`, 'i');
  }
  addRange(match, 'experienceYears', filters.minExperience, filters.maxExperience);
  addRange(match, 'currentCTC', filters.minCurrentCTC, filters.maxCurrentCTC);
  addRange(match, 'expectedCTC', filters.minExpectedCTC, filters.maxExpectedCTC);
  if (filters.dateFrom || filters.dateTo) {
    match.createdAt = {};
    if (filters.dateFrom) match.createdAt.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) match.createdAt.$lte = new Date(filters.dateTo);
  }
  if (filters.search) {
    const search = escapeRegex(filters.search);
    const expression = new RegExp(search, 'i');
    match.$or = [
      { candidateId: expression },
      { firstName: expression },
      { lastName: expression },
      { email: expression },
      { mobile: expression },
      {
        $expr: {
          $regexMatch: {
            input: { $concat: ['$firstName', ' ', '$lastName'] },
            regex: search,
            options: 'i',
          },
        },
      },
    ];
  }
  return match;
};

const SORTS = Object.freeze({
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  name: { firstName: 1, lastName: 1, _id: 1 },
  experience: { experienceYears: -1, _id: 1 },
  currentCTC: { currentCTC: -1, _id: 1 },
  expectedCTC: { expectedCTC: -1, _id: 1 },
});

const candidateListPipeline = (filters = {}) => {
  const page = Number(filters.page || 1);
  const limit = Number(filters.limit || 20);
  return [
    { $match: buildMatch(filters) },
    {
      $facet: {
        candidates: [
          { $sort: SORTS[filters.sort || 'newest'] },
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $project: {
              _id: 1,
              candidateId: 1,
              firstName: 1,
              lastName: 1,
              gender: 1,
              email: 1,
              mobile: 1,
              qualification: 1,
              experienceYears: 1,
              currentCompany: 1,
              currentCTC: 1,
              expectedCTC: 1,
              source: 1,
              status: 1,
              createdAt: 1,
            },
          },
        ],
        metadata: [{ $count: 'total' }],
      },
    },
    {
      $project: {
        _id: 0,
        candidates: 1,
        total: { $ifNull: [{ $arrayElemAt: ['$metadata.total', 0] }, 0] },
      },
    },
  ];
};

const categoryMapExpression = (countsPath, categories) => ({
  $arrayToObject: {
    $map: {
      input: categories,
      as: 'category',
      in: {
        k: '$$category',
        v: {
          $let: {
            vars: {
              matched: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: countsPath,
                      as: 'count',
                      cond: { $eq: ['$$count._id', '$$category'] },
                    },
                  },
                  0,
                ],
              },
            },
            in: { $ifNull: ['$$matched.count', 0] },
          },
        },
      },
    },
  },
});

const categoricalPipeline = (filters, field, categories, outputField) => [
  { $match: buildMatch(filters) },
  {
    $facet: {
      counts: [{ $group: { _id: `$${field}`, count: { $sum: 1 } } }],
      total: [{ $count: 'count' }],
    },
  },
  {
    $project: {
      _id: 0,
      [outputField]: categoryMapExpression('$counts', categories),
      total: { $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0] },
    },
  },
];

const statusPipeline = (filters = {}) => categoricalPipeline(
  filters, 'status', CANDIDATE_STATUSES, 'statusSummary',
);

const sourcePipeline = (filters = {}) => categoricalPipeline(
  filters, 'source', CANDIDATE_SOURCES, 'sourceSummary',
);

const monthlyPipeline = (filters = {}) => [
  { $match: buildMatch(filters) },
  {
    $group: {
      _id: { $dateToString: { date: '$createdAt', format: '%Y-%m', timezone: 'UTC' } },
      registrations: { $sum: 1 },
      selections: { $sum: { $cond: [{ $eq: ['$status', 'Selected'] }, 1, 0] } },
    },
  },
  { $sort: { _id: 1 } },
  { $project: { _id: 0, month: '$_id', registrations: 1, selections: 1 } },
];

const pipelineReportPipeline = (filters = {}) => [
  { $match: buildMatch(filters) },
  {
    $facet: {
      counts: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
      total: [{ $count: 'count' }],
    },
  },
  {
    $project: {
      _id: 0,
      pipeline: categoryMapExpression('$counts', CANDIDATE_STATUSES),
      total: { $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0] },
    },
  },
  {
    $set: {
      conversionPercentage: {
        $cond: [
          { $gt: ['$total', 0] },
          { $round: [{ $multiply: [{ $divide: ['$pipeline.Selected', '$total'] }, 100] }, 2] },
          0,
        ],
      },
    },
  },
];

const summaryPipeline = (filters = {}) => [
  { $match: buildMatch(filters) },
  {
    $facet: {
      overview: [
        {
          $group: {
            _id: null,
            totalCandidates: { $sum: 1 },
            averageExperience: { $avg: '$experienceYears' },
            averageCurrentCTC: { $avg: '$currentCTC' },
            averageExpectedCTC: { $avg: '$expectedCTC' },
          },
        },
      ],
      statusCounts: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
      sourceCounts: [{ $group: { _id: '$source', count: { $sum: 1 } } }],
    },
  },
  {
    $project: {
      _id: 0,
      totalCandidates: { $ifNull: [{ $arrayElemAt: ['$overview.totalCandidates', 0] }, 0] },
      averageExperience: { $ifNull: [{ $round: [{ $arrayElemAt: ['$overview.averageExperience', 0] }, 2] }, 0] },
      averageCurrentCTC: { $ifNull: [{ $round: [{ $arrayElemAt: ['$overview.averageCurrentCTC', 0] }, 2] }, 0] },
      averageExpectedCTC: { $ifNull: [{ $round: [{ $arrayElemAt: ['$overview.averageExpectedCTC', 0] }, 2] }, 0] },
      statusSummary: categoryMapExpression('$statusCounts', CANDIDATE_STATUSES),
      sourceSummary: categoryMapExpression('$sourceCounts', CANDIDATE_SOURCES),
    },
  },
];

const createReportService = ({ CandidateModel = Candidate } = {}) => {
  const aggregateOne = async (pipeline, fallback) => {
    const [result = fallback] = await executeAggregation(CandidateModel, pipeline);
    return result;
  };

  const getSummary = (filters) => aggregateOne(summaryPipeline(filters), {});
  const getStatusReport = (filters) => aggregateOne(statusPipeline(filters), { statusSummary: {}, total: 0 });
  const getSourceReport = (filters) => aggregateOne(sourcePipeline(filters), { sourceSummary: {}, total: 0 });
  const getMonthlyReport = (filters) => executeAggregation(CandidateModel, monthlyPipeline(filters));
  const getPipelineReport = (filters) => aggregateOne(
    pipelineReportPipeline(filters),
    { pipeline: {}, total: 0, conversionPercentage: 0 },
  );
  const getCandidates = async (filters = {}) => {
    const result = await aggregateOne(candidateListPipeline(filters), { candidates: [], total: 0 });
    const page = Number(filters.page || 1);
    const limit = Number(filters.limit || 20);
    return {
      candidates: result.candidates,
      meta: {
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
        currentPage: page,
        pageSize: limit,
      },
    };
  };

  return {
    getCandidates,
    getMonthlyReport,
    getPipelineReport,
    getSourceReport,
    getStatusReport,
    getSummary,
  };
};

module.exports = Object.assign(createReportService(), {
  buildMatch,
  candidateListPipeline,
  createReportService,
  monthlyPipeline,
  pipelineReportPipeline,
  sourcePipeline,
  statusPipeline,
  summaryPipeline,
});
