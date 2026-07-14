const express = require('express');
const settingsController = require('./settings.controller');
const { updateSettingsValidation } = require('./settings.validation');
const { adminOnly, authenticate } = require('../auth/auth.middleware');
const validateRequest = require('../../common/middleware/validateRequest');
const asyncHandler = require('../../common/utils/asyncHandler');

const router = express.Router();

router.route('/')
  .get(authenticate, adminOnly, asyncHandler(settingsController.getSettings))
  .put(
    authenticate,
    adminOnly,
    updateSettingsValidation,
    validateRequest,
    asyncHandler(settingsController.updateSettings)
  );

module.exports = router;
