const express = require('express');
const asyncHandler = require('../../common/utils/asyncHandler');
const controller = require('./dashboard.controller');

const router = express.Router();

router.get('/summary', asyncHandler(controller.summary));
router.get('/status-summary', asyncHandler(controller.statusSummary));
router.get('/source-summary', asyncHandler(controller.sourceSummary));
router.get('/monthly-trend', asyncHandler(controller.monthlyTrend));
router.get('/recent', asyncHandler(controller.recentCandidates));

module.exports = router;
