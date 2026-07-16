const { success } = require('../../common/utils/apiResponse');
const requestContext = require('../../common/utils/requestContext');
const excelImportService = require('./excelImport.service');

const importCandidates = async (req, res) => {
  const { assignedTo } = req.body;
  const result = await excelImportService.importCandidates({
    buffer: req.file.buffer,
    fileName: req.file.originalname,
    actor: { id: req.user.id },
    requestContext: requestContext(req),
    assignedTo,
  });
  return success(res, {
    message: 'Excel import completed',
    data: result,
  });
};

module.exports = { importCandidates };
