const express = require('express');
const asyncHandler = require('../../common/utils/asyncHandler');
const validateRequest = require('../../common/middleware/validateRequest');
const controller = require('./auth.controller');
const { authenticate, userOrAdmin } = require('./auth.middleware');
const {
  changePasswordValidation,
  forgotPasswordValidation,
  loginValidation,
  resetPasswordValidation,
  updateProfileValidation,
} = require('./auth.validation');

const router = express.Router();

router.post('/login', loginValidation, validateRequest, asyncHandler(controller.login));
router.post(
  '/change-password',
  authenticate,
  userOrAdmin,
  changePasswordValidation,
  validateRequest,
  asyncHandler(controller.changePassword),
);
router.post(
  '/forgot-password',
  forgotPasswordValidation,
  validateRequest,
  asyncHandler(controller.forgotPassword),
);
router.post(
  '/reset-password',
  resetPasswordValidation,
  validateRequest,
  asyncHandler(controller.resetPassword),
);
router.get('/profile', authenticate, userOrAdmin, asyncHandler(controller.profile));
router.put('/profile', authenticate, userOrAdmin, updateProfileValidation, validateRequest, asyncHandler(controller.updateProfile));

module.exports = router;
