const { success } = require('../../common/utils/apiResponse');
const requestContext = require('../../common/utils/requestContext');
const statusWorkflowService = require('./statusWorkflow.service');

const changeStatus = async (req, res) => {
  const result = await statusWorkflowService.changeStatus({
    candidateId: req.params.id,
    newStatus: req.body.status,
    remarks: req.body.remarks,
    actor: { id: req.user.id, role: req.user.role },
    requestContext: requestContext(req),
  });
  return success(res, {
    message: 'Candidate status updated successfully',
    data: result,
  });
};

const getHistory = async (req, res) => success(res, {
  message: 'Candidate status history retrieved successfully',
  data: { history: await statusWorkflowService.getHistory(req.params.id) },
});

module.exports = { changeStatus, getHistory };
