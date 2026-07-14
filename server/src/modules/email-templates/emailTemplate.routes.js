const express = require('express');
const emailTemplateController = require('./emailTemplate.controller');
const { createTemplateValidation, updateTemplateValidation } = require('./emailTemplate.validation');
const { adminOnly, authenticate } = require('../auth/auth.middleware');
const validateRequest = require('../../common/middleware/validateRequest');
const asyncHandler = require('../../common/utils/asyncHandler');
const { ROLES } = require('../candidates/candidate.constants');

const router = express.Router();

router.use(authenticate);
router.use(adminOnly);

router.route('/')
  .get(asyncHandler(emailTemplateController.getTemplates))
  .post(createTemplateValidation, validateRequest, asyncHandler(emailTemplateController.createTemplate));

router.route('/:id')
  .get(asyncHandler(emailTemplateController.getTemplateById))
  .patch(updateTemplateValidation, validateRequest, asyncHandler(emailTemplateController.updateTemplate))
  .delete(asyncHandler(emailTemplateController.deleteTemplate));

module.exports = router;
