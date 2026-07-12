const express = require('express');
const asyncHandler = require('../../common/utils/asyncHandler');
const validateRequest = require('../../common/middleware/validateRequest');
const { adminOnly, authenticate, userOrAdmin } = require('../auth/auth.middleware');
const controller = require('./candidate.controller');
const statusWorkflowRoutes = require('../status-workflow/statusWorkflow.routes');
const {
  candidateIdValidation,
  createCandidateValidation,
  listCandidatesValidation,
  updateCandidateValidation,
} = require('./candidate.validation');

const router = express.Router();

router.use(authenticate);
router.post('/', userOrAdmin, createCandidateValidation, validateRequest, asyncHandler(controller.createCandidate));
router.get('/', userOrAdmin, listCandidatesValidation, validateRequest, asyncHandler(controller.listCandidates));
router.get('/:id', userOrAdmin, candidateIdValidation, validateRequest, asyncHandler(controller.getCandidate));
router.put('/:id', userOrAdmin, candidateIdValidation, updateCandidateValidation, validateRequest, asyncHandler(controller.updateCandidate));
router.delete('/:id', adminOnly, candidateIdValidation, validateRequest, asyncHandler(controller.deleteCandidate));
router.use('/:id', statusWorkflowRoutes);

module.exports = router;
