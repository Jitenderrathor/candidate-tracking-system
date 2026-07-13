const express = require('express');
const asyncHandler = require('../../common/utils/asyncHandler');
const validateRequest = require('../../common/middleware/validateRequest');
const { adminOnly, authenticate } = require('../auth/auth.middleware');
const controller = require('./user.controller');
const {
  createUserValidation,
  listUsersValidation,
  updateUserValidation,
  userIdValidation,
} = require('./user.validation');

const router = express.Router();

router.use(authenticate, adminOnly);
router.get('/', listUsersValidation, validateRequest, asyncHandler(controller.listUsers));
router.post('/', createUserValidation, validateRequest, asyncHandler(controller.createUser));
router.get('/:id', userIdValidation, validateRequest, asyncHandler(controller.getUser));
router.put('/:id', userIdValidation, updateUserValidation, validateRequest, asyncHandler(controller.updateUser));
router.patch('/:id/activate', userIdValidation, validateRequest, asyncHandler(controller.activateUser));
router.patch('/:id/deactivate', userIdValidation, validateRequest, asyncHandler(controller.deactivateUser));
router.post('/:id/reset-password', userIdValidation, validateRequest, asyncHandler(controller.resetPassword));

module.exports = router;
