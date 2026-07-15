const express = require('express');
const asyncHandler = require('../../common/utils/asyncHandler');
const { success } = require('../../common/utils/apiResponse');
const { adminOnly, authenticate, requirePermission } = require('../auth/auth.middleware');
const controller = require('./excelImport.controller');
const { requireWorkbook, uploadCandidateWorkbook } = require('./excelImport.upload');

const router = express.Router();

router.get('/', (_req, res) => success(res, {
  message: 'excel-import module is available',
  data: {
    module: 'excel-import',
    description: 'Spreadsheet upload, validation, and import lifecycle',
    implementationStatus: 'implemented',
  },
}));
router.post(
  '/import',
  authenticate,
  requirePermission('excel_import'),
  uploadCandidateWorkbook,
  requireWorkbook,
  asyncHandler(controller.importCandidates),
);

const historyController = require('./importHistory.controller');
router.get(
  '/history',
  authenticate,
  requirePermission('excel_import'),
  historyController.listImportHistory
);

module.exports = router;
