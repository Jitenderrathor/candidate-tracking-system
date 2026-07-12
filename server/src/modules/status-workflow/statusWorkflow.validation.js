const { body } = require('express-validator');
const { CANDIDATE_STATUSES } = require('../candidates/candidate.constants');

const transitionValidation = [
  body('status').isIn(CANDIDATE_STATUSES).withMessage('Status is invalid'),
  body('remarks').optional().isString().trim().isLength({ max: 2000 }),
];

module.exports = { transitionValidation };
