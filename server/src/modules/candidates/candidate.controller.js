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

module.exports = {
  createCandidate,
  deleteCandidate,
  getCandidate,
  listCandidates,
  updateCandidate,
};
