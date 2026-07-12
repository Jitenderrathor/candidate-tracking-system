const { success } = require('../../common/utils/apiResponse');
const reportService = require('./report.service');

const summary = async (req, res) => success(res, {
  message: 'Report summary retrieved successfully',
  data: await reportService.getSummary(req.query),
});

const candidates = async (req, res) => {
  const result = await reportService.getCandidates(req.query);
  return success(res, {
    message: 'Candidate report retrieved successfully',
    data: { candidates: result.candidates },
    meta: result.meta,
  });
};

const status = async (req, res) => success(res, {
  message: 'Status report retrieved successfully',
  data: await reportService.getStatusReport(req.query),
});

const source = async (req, res) => success(res, {
  message: 'Source report retrieved successfully',
  data: await reportService.getSourceReport(req.query),
});

const monthly = async (req, res) => success(res, {
  message: 'Monthly report retrieved successfully',
  data: { monthly: await reportService.getMonthlyReport(req.query) },
});

const pipeline = async (req, res) => success(res, {
  message: 'Recruitment pipeline report retrieved successfully',
  data: await reportService.getPipelineReport(req.query),
});

module.exports = { candidates, monthly, pipeline, source, status, summary };
