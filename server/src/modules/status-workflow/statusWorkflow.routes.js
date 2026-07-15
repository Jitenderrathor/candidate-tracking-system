const express = require('express');
const asyncHandler = require('../../common/utils/asyncHandler');
const validateRequest = require('../../common/middleware/validateRequest');
const { requirePermission } = require('../auth/auth.middleware');
const { candidateIdValidation } = require('../candidates/candidate.validation');
const controller = require('./statusWorkflow.controller');
const { transitionValidation } = require('./statusWorkflow.validation');
const { success } = require('../../common/utils/apiResponse');

const router = express.Router({ mergeParams: true });

router.get('/', (_req, res) => success(res, {
  message: 'status-workflow module is available',
  data: {
    module: 'status-workflow',
    description: 'Candidate stage definitions and controlled transitions',
    implementationStatus: 'implemented',
  },
}));
router.patch(
  '/status',
  requirePermission('edit_candidate'),
  candidateIdValidation,
  transitionValidation,
  validateRequest,
  asyncHandler(controller.changeStatus),
);
router.get(
  '/history',
  candidateIdValidation,
  validateRequest,
  asyncHandler(controller.getHistory),
);

module.exports = router;
