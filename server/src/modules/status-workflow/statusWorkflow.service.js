const mongoose = require('mongoose');
const AppError = require('../../common/errors/AppError');
const { documentLookup } = require('../../common/utils/mongoQuery');
const Candidate = require('../candidates/candidate.model');
const activityLogService = require('../activity-logs/activityLog.service');
const StatusHistory = require('./statusHistory.model');
const { TRANSACTION_OPTIONS } = require('../../config/database');

const STATUS_ORDER = {
  'Registered': 1,
  'Under Consideration': 2,
  'To Be Shortlisted': 3,
  'Selected': 4,
};

const validateTransition = ({ oldStatus, newStatus, actor, remarks }) => {
  if (oldStatus === newStatus) {
    throw new AppError('Candidate is already in this status', 422, { code: 'SAME_STATUS' });
  }

  // Moving to Rejected is always allowed from any non-Rejected status
  if (newStatus === 'Rejected' && oldStatus !== 'Rejected') return;

  const oldOrder = STATUS_ORDER[oldStatus] || 0;
  const newOrder = STATUS_ORDER[newStatus] || 0;

  // Forward transition (skipping steps is allowed)
  if (newOrder > oldOrder) return;

  // Backward transition
  const isAdminRollback = actor.role === 'Super Admin' || actor.role === 'Admin' || (actor.permissions && actor.permissions.includes('candidates:update-backwards'));
  
  if (isAdminRollback) {
    if (!remarks?.trim()) {
      throw new AppError('Remarks are required when moving a candidate backwards', 422, {
        code: 'BACKWARD_REMARKS_REQUIRED',
      });
    }
    return;
  }

  if (newOrder < oldOrder) {
    throw new AppError('Only an Admin can move a candidate backwards', 403, {
      code: 'ADMIN_REQUIRED_FOR_BACKWARD_TRANSITION',
    });
  }

  throw new AppError(`Transition from ${oldStatus} to ${newStatus} is not allowed`, 409, {
    code: 'INVALID_STATUS_TRANSITION',
  });
};

const createStatusWorkflowService = ({
  CandidateModel = Candidate,
  StatusHistoryModel = StatusHistory,
  auditService = activityLogService,
  startSession = mongoose.startSession,
} = {}) => {
  const changeStatus = async ({ candidateId, newStatus, remarks, actor, requestContext }) => {
    const session = await startSession();
    let result;

    try {
      await session.withTransaction(async () => {
        const candidate = await CandidateModel.findOne({
          ...documentLookup(candidateId, 'candidateId'),
          isDeleted: false,
        }).session(session);

        if (!candidate) {
          throw new AppError('Candidate not found', 404, { code: 'CANDIDATE_NOT_FOUND' });
        }

        const oldStatus = candidate.status;
        validateTransition({ oldStatus, newStatus, actor, remarks });
        const changedAt = new Date();

        candidate.status = newStatus;
        if (candidate.recruitmentStatus) candidate.recruitmentStatus = newStatus;
        candidate.updatedBy = actor.id;
        await candidate.save({ session });

        const historyPayload = {
          candidateId: candidate.candidateId,
          candidateObjectId: candidate._id,
          oldStatus,
          newStatus,
          remarks: remarks || '',
          changedBy: actor.id,
          changedAt,
          ipAddress: requestContext.ipAddress,
          userAgent: requestContext.userAgent,
        };
        const [history] = await StatusHistoryModel.create([historyPayload], { session });

        await auditService.logCandidateStatusChange({
          userId: actor.id,
          candidateId: candidate.candidateId,
          candidateObjectId: candidate._id,
          oldStatus,
          newStatus,
          changedAt,
          ipAddress: requestContext.ipAddress,
          userAgent: requestContext.userAgent,
        }, session);

        result = { candidate, history };
      }, TRANSACTION_OPTIONS);
      return result;
    } finally {
      await session.endSession();
    }
  };

  const getHistory = async (candidateId) => {
    const candidate = await CandidateModel.findOne({
      ...documentLookup(candidateId, 'candidateId'),
      isDeleted: false,
    }).select('_id');
    if (!candidate) {
      throw new AppError('Candidate not found', 404, { code: 'CANDIDATE_NOT_FOUND' });
    }

    return StatusHistoryModel.find({ candidateObjectId: candidate._id })
      .sort({ changedAt: -1 })
      .populate('changedBy', 'name email role')
      .lean();
  };

  return { changeStatus, getHistory };
};

module.exports = Object.assign(createStatusWorkflowService(), {
  createStatusWorkflowService,
  validateTransition,
});
