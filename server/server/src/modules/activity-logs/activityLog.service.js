const ActivityLog = require('./activityLog.model');

const createActivityLogService = ({ ActivityLogModel = ActivityLog } = {}) => {
  const createActivity = async (payload, session) => {
    const [activity] = await ActivityLogModel.create([payload], { session });
    return activity;
  };

  const logCandidateStatusChange = async (event, session) => {
    return createActivity({
      user: event.userId,
      candidate: event.candidateObjectId,
      candidateId: event.candidateId,
      action: 'CANDIDATE_STATUS_CHANGED',
      oldStatus: event.oldStatus,
      newStatus: event.newStatus,
      occurredAt: event.changedAt,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
    }, session);
  };

  const logExcelImportStarted = (event) => createActivity({
    user: event.userId,
    action: 'EXCEL_IMPORT_STARTED',
    fileName: event.fileName,
    occurredAt: event.occurredAt,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
  });

  const logExcelImportCompleted = (event, session) => createActivity({
    user: event.userId,
    action: 'EXCEL_IMPORT_COMPLETED',
    importedCount: event.importedCount,
    skippedCount: event.skippedCount,
    fileName: event.fileName,
    occurredAt: event.occurredAt,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
  }, session);

  return { logCandidateStatusChange, logExcelImportCompleted, logExcelImportStarted };
};

module.exports = Object.assign(createActivityLogService(), { createActivityLogService });
