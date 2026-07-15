const express = require('express');
const asyncHandler = require('../../common/utils/asyncHandler');
const validateRequest = require('../../common/middleware/validateRequest');
const { adminOnly, authenticate, requirePermission, requireAnyPermission } = require('../auth/auth.middleware');
const controller = require('./user.controller');
const {
  createUserValidation,
  listUsersValidation,
  updateUserValidation,
  userIdValidation,
} = require('./user.validation');

const router = express.Router();

router.use(authenticate);
router.get('/', requireAnyPermission('manage_users', 'assign_candidates'), listUsersValidation, validateRequest, asyncHandler(controller.listUsers));
router.post('/', requirePermission('manage_users'), createUserValidation, validateRequest, asyncHandler(controller.createUser));
router.get('/:id', requirePermission('manage_users'), userIdValidation, validateRequest, asyncHandler(controller.getUser));
router.put('/:id', requirePermission('manage_users'), userIdValidation, updateUserValidation, validateRequest, asyncHandler(controller.updateUser));
router.patch('/:id/activate', requirePermission('manage_users'), userIdValidation, validateRequest, asyncHandler(controller.activateUser));
router.patch('/:id/deactivate', requirePermission('manage_users'), userIdValidation, validateRequest, asyncHandler(controller.deactivateUser));
router.post('/:id/reset-password', requirePermission('manage_users'), userIdValidation, validateRequest, asyncHandler(controller.resetPassword));
router.delete('/:id', requirePermission('manage_users'), userIdValidation, validateRequest, asyncHandler(controller.deleteUser));

module.exports = router;
