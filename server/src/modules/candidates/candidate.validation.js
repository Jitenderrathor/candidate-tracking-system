const { body, param, query } = require('express-validator');
const {
  CANDIDATE_SOURCES,
  CANDIDATE_STATUSES,
  GENDERS,
} = require('./candidate.constants');

const mobilePattern = /^\+?[0-9]{7,15}$/;
const candidateReferencePattern = /^CRTS\d{6}$/;
const editableFields = new Set([
  'fullName', 'gender', 'email', 'mobile',
  'experienceYears', 'resumeUrl', 'linkedInProfile', 'source', 'remarks',
]);

const createCandidateValidation = [
  body('fullName').isString().trim().notEmpty().isLength({ max: 200 }),
  body('gender').isIn(GENDERS).withMessage('Gender is invalid'),
  body('email').trim().isEmail().normalizeEmail().withMessage('A valid email is required'),
  body('mobile').optional({ values: 'falsy' }).trim().matches(mobilePattern).withMessage('A valid mobile number is required'),
  body('experienceYears').isFloat({ min: 0, max: 80 }).toFloat(),
  body('resumeUrl').optional({ values: 'falsy' }).isURL({ protocols: ['http', 'https'], require_protocol: true }),
  body('linkedInProfile').optional({ values: 'falsy' }).isURL({ protocols: ['http', 'https'], require_protocol: true }),
  body('source').isString().trim().notEmpty().withMessage('Source is required').isLength({ max: 200 }),
  body('status').not().exists().withMessage('Status is managed through the status workflow'),
  body('remarks').optional().isString().trim().isLength({ max: 2000 }),
];

const updateCandidateValidation = [
  body('candidateId').not().exists().withMessage('candidateId cannot be modified'),
  body('status').not().exists().withMessage('Status is managed through the status workflow'),
  body('fullName').optional().isString().trim().notEmpty().isLength({ max: 200 }),
  body('gender').optional().isIn(GENDERS).withMessage('Gender is invalid'),
  body('email').optional().trim().isEmail().normalizeEmail(),
  body('mobile').optional({ values: 'falsy' }).trim().matches(mobilePattern),
  body('experienceYears').optional().isFloat({ min: 0, max: 80 }).toFloat(),
  body('resumeUrl').optional({ values: 'falsy' }).isURL({ protocols: ['http', 'https'], require_protocol: true }),
  body('linkedInProfile').optional({ values: 'falsy' }).isURL({ protocols: ['http', 'https'], require_protocol: true }),
  body('source').optional().isString().trim().notEmpty().isLength({ max: 200 }),
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
  query('source').optional().isString().trim().isLength({ max: 200 }),
  query('assignedTo').optional().isMongoId(),
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

const bulkAssignValidation = [
  body('candidateIds').isArray({ min: 1 }).withMessage('candidateIds must be a non-empty array'),
  body('assignedTo').isMongoId().withMessage('assignedTo must be a valid User ID'),
];

module.exports = {
  candidateIdValidation,
  createCandidateValidation,
  listCandidatesValidation,
  updateCandidateValidation,
  bulkAssignValidation,
};
