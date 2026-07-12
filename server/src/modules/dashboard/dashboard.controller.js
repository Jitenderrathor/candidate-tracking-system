const { success } = require('../../common/utils/apiResponse');
const dashboardService = require('./dashboard.service');

const summary = async (_req, res) => success(res, {
  message: 'Dashboard summary retrieved successfully',
  data: await dashboardService.getSummary(),
});

const statusSummary = async (_req, res) => success(res, {
  message: 'Status summary retrieved successfully',
  data: { statusSummary: await dashboardService.getStatusSummary() },
});

const sourceSummary = async (_req, res) => success(res, {
  message: 'Source summary retrieved successfully',
  data: { sourceSummary: await dashboardService.getSourceSummary() },
});

const monthlyTrend = async (_req, res) => success(res, {
  message: 'Monthly registration trend retrieved successfully',
  data: { monthlyTrend: await dashboardService.getMonthlyTrend() },
});

const recentCandidates = async (_req, res) => success(res, {
  message: 'Recent candidates retrieved successfully',
  data: { recentCandidates: await dashboardService.getRecentCandidates() },
});

module.exports = { monthlyTrend, recentCandidates, sourceSummary, statusSummary, summary };
