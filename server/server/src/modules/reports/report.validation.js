const { query } = require('express-validator');
const {
  CANDIDATE_SOURCES,
  CANDIDATE_STATUSES,
  GENDERS,
} = require('../candidates/candidate.constants');

const reportQueryValidation = [
  query('status').optional().isIn(CANDIDATE_STATUSES),
  query('source').optional().isIn(CANDIDATE_SOURCES),
  query('gender').optional().isIn(GENDERS),
  query('qualification').optional().isString().trim().isLength({ max: 200 }),
  query('minExperience').optional().isFloat({ min: 0, max: 80 }).toFloat(),
  query('maxExperience').optional().isFloat({ min: 0, max: 80 }).toFloat(),
  query('minCurrentCTC').optional().isFloat({ min: 0 }).toFloat(),
  query('maxCurrentCTC').optional().isFloat({ min: 0 }).toFloat(),
  query('minExpectedCTC').optional().isFloat({ min: 0 }).toFloat(),
  query('maxExpectedCTC').optional().isFloat({ min: 0 }).toFloat(),
  query('dateFrom').optional().isISO8601().toDate(),
  query('dateTo').optional().isISO8601().toDate(),
  query('search').optional().isString().trim().isLength({ max: 100 }),
  query('sort').optional().isIn([
    'newest', 'oldest', 'name', 'experience', 'currentCTC', 'expectedCTC',
  ]),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query().custom((value) => {
    const ranges = [
      ['minExperience', 'maxExperience'],
      ['minCurrentCTC', 'maxCurrentCTC'],
      ['minExpectedCTC', 'maxExpectedCTC'],
    ];
    ranges.forEach(([minimum, maximum]) => {
      if (value[minimum] !== undefined && value[maximum] !== undefined
        && Number(value[minimum]) > Number(value[maximum])) {
        throw new Error(`${minimum} cannot exceed ${maximum}`);
      }
    });
    if (value.dateFrom && value.dateTo && new Date(value.dateFrom) > new Date(value.dateTo)) {
      throw new Error('dateFrom cannot be after dateTo');
    }
    return true;
  }),
];

module.exports = { reportQueryValidation };
