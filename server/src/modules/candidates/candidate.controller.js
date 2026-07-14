const { success } = require('../../common/utils/apiResponse');
const candidateService = require('./candidate.service');
const emailService = require('../email/email.service');
const emailTemplateService = require('../email-templates/emailTemplate.service');
const AppError = require('../../common/errors/AppError');

const createCandidate = async (req, res) => success(res, {
  statusCode: 201,
  message: 'Candidate created successfully',
  data: { candidate: await candidateService.create(req.body, req.user.id) },
});

const listCandidates = async (req, res) => {
  const { candidates, meta } = await candidateService.list(req.query);
  return success(res, {
    message: 'Candidates retrieved successfully',
    data: { candidates },
    meta,
  });
};

const getCandidate = async (req, res) => success(res, {
  message: 'Candidate retrieved successfully',
  data: { candidate: await candidateService.getById(req.params.id) },
});

const updateCandidate = async (req, res) => success(res, {
  message: 'Candidate updated successfully',
  data: { candidate: await candidateService.update(req.params.id, req.body, req.user.id) },
});

const deleteCandidate = async (req, res) => {
  await candidateService.remove(req.params.id, req.user.id);
  return success(res, { message: 'Candidate deleted successfully' });
};

const listTrash = async (req, res) => {
  const { candidates, meta } = await candidateService.listTrash(req.query);
  return success(res, {
    message: 'Deleted candidates retrieved successfully',
    data: { candidates },
    meta,
  });
};

const restoreCandidate = async (req, res) => {
  await candidateService.restore(req.params.id, req.user.id);
  return success(res, { message: 'Candidate restored successfully' });
};

const bulkDelete = async (req, res) => {
  const { candidateIds } = req.body || {};
  const result = await candidateService.bulkDelete(req.user.id, candidateIds);
  return success(res, { message: `Successfully deleted ${result.deletedCount} candidates`, data: result });
};

const bulkRestore = async (req, res) => {
  const result = await candidateService.bulkRestore(req.user.id);
  return success(res, { message: `Successfully restored ${result.restoredCount} candidates`, data: result });
};

const exportCandidates = async (req, res) => {
  const buffer = await candidateService.exportData(req.query);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="candidates.xlsx"');
  return res.send(buffer);
};

const bulkEmail = async (req, res) => {
  const { candidateIds, statuses, templateId, cc, bcc } = req.body;
  if ((!candidateIds || !candidateIds.length) && (!statuses || !statuses.length)) {
    throw new AppError('No candidates or statuses selected', 400);
  }
  if (!templateId) {
    throw new AppError('No template selected', 400);
  }

  const template = await emailTemplateService.getTemplateById(templateId);
  
  let candidates = [];
  if (candidateIds && candidateIds.length) {
    candidates = await candidateService.getByIds(candidateIds);
  } else if (statuses && statuses.length) {
    candidates = await candidateService.getByStatuses(statuses);
  }

  if (candidates.length === 0) {
    throw new AppError('No candidates found to email', 404);
  }
  
  // Fire and forget so we don't block the request if there are hundreds of emails
  emailService.sendBulkEmails(candidates, template, { cc, bcc }).catch(console.error);

  return success(res, { message: `Bulk email process started for ${candidates.length} candidates` });
};

module.exports = {
  createCandidate,
  deleteCandidate,
  getCandidate,
  listCandidates,
  updateCandidate,
  listTrash,
  restoreCandidate,
  bulkDelete,
  bulkRestore,
  exportCandidates,
  bulkEmail,
};
