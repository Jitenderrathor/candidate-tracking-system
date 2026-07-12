const { success } = require('../../common/utils/apiResponse');
const candidateService = require('./candidate.service');

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
};
