const Candidate = require('../candidates/candidate.model');
const { executeAggregation } = require('../../common/utils/mongoQuery');
const {
  CANDIDATE_SOURCES,
  CANDIDATE_STATUSES,
} = require('../candidates/candidate.constants');

const GENDER_SUMMARY_CATEGORIES = ['Male', 'Female', 'Unknown / Not Specified'];

const ACTIVE_FILTER = Object.freeze({ isDeleted: false });

const countsPipeline = () => [
  {
    $group: {
      _id: null,
      totalCandidates: { $sum: 1 },
      activeCandidates: {
        $sum: { $cond: [{ $eq: ['$isDeleted', false] }, 1, 0] },
      },
    },
  },
  { $project: { _id: 0, totalCandidates: 1, activeCandidates: 1 } },
];

const categoricalSummaryPipeline = (field, categories, outputField, groupId = `$${field}`) => [
  { $match: ACTIVE_FILTER },
  {
    $facet: {
      counts: [
        { $group: { _id: groupId, count: { $sum: 1 } } },
      ],
    },
  },
  {
    $project: {
      _id: 0,
      [outputField]: {
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
                            input: '$counts',
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
      },
    },
  },
];

const statusSummaryPipeline = () => categoricalSummaryPipeline(
  'status',
  CANDIDATE_STATUSES,
  'statusSummary',
);

const sourceSummaryPipeline = () => categoricalSummaryPipeline(
  'source',
  CANDIDATE_SOURCES,
  'sourceSummary',
);

const genderSummaryPipeline = () => categoricalSummaryPipeline(
  'gender',
  GENDER_SUMMARY_CATEGORIES,
  'genderSummary',
  {
    $switch: {
      branches: [
        { case: { $eq: ['$gender', 'Male'] }, then: 'Male' },
        { case: { $eq: ['$gender', 'Female'] }, then: 'Female' },
      ],
      default: 'Unknown / Not Specified',
    },
  },
);

const monthRange = (now = new Date()) => {
  const currentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return {
    startMonth: new Date(Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() - 11, 1)),
    nextMonth: new Date(Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() + 1, 1)),
  };
};

const monthlyTrendPipeline = (now = new Date()) => {
  const { startMonth, nextMonth } = monthRange(now);
  return [
    {
      $match: {
        ...ACTIVE_FILTER,
        createdAt: { $gte: startMonth, $lt: nextMonth },
      },
    },
    {
      $facet: {
        counts: [
          {
            $group: {
              _id: { $dateTrunc: { date: '$createdAt', unit: 'month', timezone: 'UTC' } },
              count: { $sum: 1 },
            },
          },
        ],
      },
    },
    {
      $project: {
        _id: 0,
        monthlyTrend: {
          $map: {
            input: { $range: [0, 12] },
            as: 'offset',
            in: {
              $let: {
                vars: {
                  monthDate: {
                    $dateAdd: { startDate: startMonth, unit: 'month', amount: '$$offset' },
                  },
                },
                in: {
                  month: {
                    $dateToString: { date: '$$monthDate', format: '%Y-%m', timezone: 'UTC' },
                  },
                  registrationCount: {
                    $let: {
                      vars: {
                        matched: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: '$counts',
                                as: 'count',
                                cond: { $eq: ['$$count._id', '$$monthDate'] },
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
          },
        },
      },
    },
  ];
};

const recentCandidatesPipeline = () => [
  { $match: ACTIVE_FILTER },
  { $sort: { createdAt: -1, _id: -1 } },
  { $limit: 10 },
  {
    $project: {
      _id: 0,
      candidateId: 1,
      name: {
        $trim: { input: { $concat: ['$firstName', ' ', '$lastName'] } },
      },
      source: 1,
      status: 1,
      createdAt: 1,
    },
  },
];

const createDashboardService = ({ CandidateModel = Candidate, now = () => new Date() } = {}) => {
  const getCounts = async () => {
    const [counts = { totalCandidates: 0, activeCandidates: 0 }] = await executeAggregation(
      CandidateModel,
      countsPipeline(),
    );
    return counts;
  };

  const getStatusSummary = async () => {
    const [result = { statusSummary: {} }] = await executeAggregation(
      CandidateModel,
      statusSummaryPipeline(),
    );
    return result.statusSummary;
  };

  const getSourceSummary = async () => {
    const [result = { sourceSummary: {} }] = await executeAggregation(
      CandidateModel,
      sourceSummaryPipeline(),
    );
    return result.sourceSummary;
  };

  const getGenderSummary = async () => {
    const [result = { genderSummary: {} }] = await executeAggregation(
      CandidateModel,
      genderSummaryPipeline(),
    );
    return result.genderSummary;
  };

  const getMonthlyTrend = async () => {
    const [result = { monthlyTrend: [] }] = await executeAggregation(
      CandidateModel,
      monthlyTrendPipeline(now()),
    );
    return result.monthlyTrend;
  };

  const getRecentCandidates = () => executeAggregation(CandidateModel, recentCandidatesPipeline());

  const getSummary = async () => {
    const [
      counts,
      statusSummary,
      sourceSummary,
      genderSummary,
      monthlyTrend,
      recentCandidates,
    ] = await Promise.all([
      getCounts(),
      getStatusSummary(),
      getSourceSummary(),
      getGenderSummary(),
      getMonthlyTrend(),
      getRecentCandidates(),
    ]);
    return {
      ...counts,
      statusSummary,
      sourceSummary,
      genderSummary,
      monthlyTrend,
      recentCandidates,
    };
  };

  return {
    getGenderSummary,
    getMonthlyTrend,
    getRecentCandidates,
    getSourceSummary,
    getStatusSummary,
    getSummary,
  };
};

module.exports = Object.assign(createDashboardService(), {
  countsPipeline,
  createDashboardService,
  genderSummaryPipeline,
  monthlyTrendPipeline,
  recentCandidatesPipeline,
  sourceSummaryPipeline,
  statusSummaryPipeline,
});
