const express = require('express');
const asyncHandler = require('../../common/utils/asyncHandler');
const validateRequest = require('../../common/middleware/validateRequest');
const { success } = require('../../common/utils/apiResponse');
const { authenticate, userOrAdmin } = require('../auth/auth.middleware');
const controller = require('./report.controller');
const { reportQueryValidation } = require('./report.validation');

const router = express.Router();

router.get('/', (_req, res) => success(res, {
  message: 'reports module is available',
  data: {
    module: 'reports',
    description: 'Filtered recruitment reports',
    implementationStatus: 'implemented',
  },
}));
router.use(authenticate, userOrAdmin);
router.get('/summary', reportQueryValidation, validateRequest, asyncHandler(controller.summary));
router.get('/candidates', reportQueryValidation, validateRequest, asyncHandler(controller.candidates));
router.get('/status', reportQueryValidation, validateRequest, asyncHandler(controller.status));
router.get('/source', reportQueryValidation, validateRequest, asyncHandler(controller.source));
router.get('/monthly', reportQueryValidation, validateRequest, asyncHandler(controller.monthly));
router.get('/pipeline', reportQueryValidation, validateRequest, asyncHandler(controller.pipeline));

module.exports = router;
