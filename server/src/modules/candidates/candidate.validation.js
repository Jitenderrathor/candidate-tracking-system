const { body, param, query } = require('express-validator');
const {
  CANDIDATE_SOURCES,
  CANDIDATE_STATUSES,
  GENDERS,
} = require('./candidate.constants');

const mobilePattern = /^\+?[1-9]\d{6,14}$/;
const candidateReferencePattern = /^CRTS\d{6}$/;
const editableFields = new Set([
  'firstName', 'lastName', 'gender', 'dateOfBirth', 'email', 'mobile', 'address',
  'qualification', 'experienceYears', 'currentCompany', 'currentCTC', 'expectedCTC',
  'skills', 'resumeUrl', 'source', 'remarks',
]);

const createCandidateValidation = [
  body('firstName').isString().trim().notEmpty().isLength({ max: 100 }),
  body('lastName').isString().trim().notEmpty().isLength({ max: 100 }),
  body('gender').isIn(GENDERS).withMessage('Gender is invalid'),
  body('dateOfBirth').isISO8601().toDate().custom((value) => value < new Date())
    .withMessage('Date of birth must be in the past'),
  body('email').trim().isEmail().normalizeEmail().withMessage('A valid email is required'),
  body('mobile').trim().matches(mobilePattern).withMessage('A valid mobile number is required'),
  body('address').isString().trim().notEmpty().isLength({ max: 500 }),
  body('qualification').isString().trim().notEmpty().isLength({ max: 200 }),
  body('experienceYears').isFloat({ min: 0, max: 80 }).toFloat(),
  body('currentCompany').optional().isString().trim().isLength({ max: 200 }),
  body('currentCTC').optional().isFloat({ min: 0 }).toFloat(),
  body('expectedCTC').optional().isFloat({ min: 0 }).toFloat(),
  body('skills').isArray({ min: 1, max: 100 }).withMessage('At least one skill is required'),
  body('skills.*').isString().trim().notEmpty().isLength({ max: 100 }),
  body('resumeUrl').optional({ values: 'falsy' }).isURL({ protocols: ['http', 'https'], require_protocol: true }),
  body('source').isIn(CANDIDATE_SOURCES).withMessage('Source is invalid'),
  body('status').not().exists().withMessage('Status is managed through the status workflow'),
  body('remarks').optional().isString().trim().isLength({ max: 2000 }),
];

const updateCandidateValidation = [
  body('candidateId').not().exists().withMessage('candidateId cannot be modified'),
  body('status').not().exists().withMessage('Status is managed through the status workflow'),
  body('firstName').optional().isString().trim().notEmpty().isLength({ max: 100 }),
  body('lastName').optional().isString().trim().notEmpty().isLength({ max: 100 }),
  body('gender').optional().isIn(GENDERS).withMessage('Gender is invalid'),
  body('dateOfBirth').optional().isISO8601().toDate().custom((value) => value < new Date())
    .withMessage('Date of birth must be in the past'),
  body('email').optional().trim().isEmail().normalizeEmail(),
  body('mobile').optional().trim().matches(mobilePattern),
  body('address').optional().isString().trim().notEmpty().isLength({ max: 500 }),
  body('qualification').optional().isString().trim().notEmpty().isLength({ max: 200 }),
  body('experienceYears').optional().isFloat({ min: 0, max: 80 }).toFloat(),
  body('currentCompany').optional().isString().trim().isLength({ max: 200 }),
  body('currentCTC').optional().isFloat({ min: 0 }).toFloat(),
  body('expectedCTC').optional().isFloat({ min: 0 }).toFloat(),
  body('skills').optional().isArray({ min: 1, max: 100 }),
  body('skills.*').optional().isString().trim().notEmpty().isLength({ max: 100 }),
  body('resumeUrl').optional({ values: 'falsy' }).isURL({ protocols: ['http', 'https'], require_protocol: true }),
  body('source').optional().isIn(CANDIDATE_SOURCES),
  body('remarks').optional().isString().trim().isLength({ max: 2000 }),
  body().custom((value) => {
    const suppliedEditableFields = Object.keys(value).filter((key) => editableFields.has(key));
    if (suppliedEditableFields.length === 0) throw new Error('At least one editable field is required');
    return true;
  }),
];

const candidateIdValidation = [
  param('id').custom((value) => {
    if (!candidateReferencePattern.test(value) && !/^[a-f\d]{24}$/i.test(value)) {
      throw new Error('Candidate reference must be a MongoDB ID or CRTS candidate ID');
    }
    return true;
  }),
];

const listCandidatesValidation = [
  query('search').optional().isString().trim().isLength({ max: 100 }),
  query('status').optional().isIn(CANDIDATE_STATUSES),
  query('source').optional().isIn(CANDIDATE_SOURCES),
  query('qualification').optional().isString().trim().isLength({ max: 200 }),
  query('minExperience').optional().isFloat({ min: 0, max: 80 }).toFloat(),
  query('maxExperience').optional().isFloat({ min: 0, max: 80 }).toFloat(),
  query('createdFrom').optional().isISO8601().toDate(),
  query('createdTo').optional().isISO8601().toDate(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('sort').optional().isString().trim().isLength({ max: 100 }),
  query().custom((value) => {
    if (value.minExperience !== undefined && value.maxExperience !== undefined
      && Number(value.minExperience) > Number(value.maxExperience)) {
      throw new Error('minExperience cannot exceed maxExperience');
    }
    if (value.createdFrom && value.createdTo
      && new Date(value.createdFrom) > new Date(value.createdTo)) {
      throw new Error('createdFrom cannot be after createdTo');
    }
    return true;
  }),
];

module.exports = {
  candidateIdValidation,
  createCandidateValidation,
  listCandidatesValidation,
  updateCandidateValidation,
};
