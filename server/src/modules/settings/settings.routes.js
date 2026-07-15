const express = require('express');
const settingsController = require('./settings.controller');
const { updateSettingsValidation } = require('./settings.validation');
const { adminOnly, authenticate, requirePermission } = require('../auth/auth.middleware');
const validateRequest = require('../../common/middleware/validateRequest');
const asyncHandler = require('../../common/utils/asyncHandler');

const router = express.Router();

router.route('/')
  .get(authenticate, requirePermission('system_settings'), asyncHandler(settingsController.getSettings))
  .put(
    authenticate,
    requirePermission('system_settings'),
    updateSettingsValidation,
    validateRequest,
    asyncHandler(settingsController.updateSettings)
  );

module.exports = router;
