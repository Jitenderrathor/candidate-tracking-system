const express = require('express');
const asyncHandler = require('../../common/utils/asyncHandler');
const validateRequest = require('../../common/middleware/validateRequest');
const { adminOnly, authenticate, userOrAdmin, requirePermission } = require('../auth/auth.middleware');
const controller = require('./candidate.controller');
const statusWorkflowRoutes = require('../status-workflow/statusWorkflow.routes');
const {
  candidateIdValidation,
  createCandidateValidation,
  listCandidatesValidation,
  updateCandidateValidation,
  bulkAssignValidation,
} = require('./candidate.validation');

const router = express.Router();

router.use(authenticate);

// Trash routes (must be placed before /:id routes so "trash" isn't treated as an ID)
router.get('/trash/list', requirePermission('recycle_bin'), listCandidatesValidation, validateRequest, asyncHandler(controller.listTrash));
router.post('/trash/bulk-delete', requirePermission('recycle_bin'), asyncHandler(controller.bulkDelete));
router.post('/trash/bulk-restore', requirePermission('recycle_bin'), asyncHandler(controller.bulkRestore));
router.post('/trash/:id/restore', requirePermission('recycle_bin'), candidateIdValidation, validateRequest, asyncHandler(controller.restoreCandidate));

router.get('/export', requirePermission('export_excel'), listCandidatesValidation, validateRequest, asyncHandler(controller.exportCandidates));

router.post('/bulk-email', requirePermission('bulk_email'), asyncHandler(controller.bulkEmail));
router.patch('/bulk-assign', requirePermission('assign_candidates'), bulkAssignValidation, validateRequest, asyncHandler(controller.bulkAssign));

router.post('/', requirePermission('add_candidate'), createCandidateValidation, validateRequest, asyncHandler(controller.createCandidate));
router.get('/', listCandidatesValidation, validateRequest, asyncHandler(controller.listCandidates));
router.get('/:id', candidateIdValidation, validateRequest, asyncHandler(controller.getCandidate));
router.put('/:id', requirePermission('edit_candidate'), candidateIdValidation, updateCandidateValidation, validateRequest, asyncHandler(controller.updateCandidate));
router.delete('/:id', requirePermission('recycle_bin'), candidateIdValidation, validateRequest, asyncHandler(controller.deleteCandidate));
router.use('/:id', statusWorkflowRoutes);

module.exports = router;
