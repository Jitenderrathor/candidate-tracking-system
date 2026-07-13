const path = require('node:path');
const multer = require('multer');
const AppError = require('../../common/errors/AppError');

const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const CSV_MIME_TYPES = new Set(['text/csv', 'application/csv', 'application/vnd.ms-excel']);
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

const uploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const isXlsx = extension === '.xlsx'
      && (!file.mimetype || file.mimetype === XLSX_MIME_TYPE || file.mimetype === 'application/octet-stream');
    const isCsv = extension === '.csv'
      && (!file.mimetype || CSV_MIME_TYPES.has(file.mimetype) || file.mimetype === 'text/plain');
    if (!isXlsx && !isCsv) {
      return callback(new AppError('Only .xlsx and .csv files are accepted', 415, {
        code: 'UNSUPPORTED_FILE_TYPE',
      }));
    }
    return callback(null, true);
  },
});

const uploadCandidateWorkbook = (req, res, next) => {
  uploader.single('file')(req, res, (error) => {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('Spreadsheet file exceeds the 20 MB limit', 413, {
        code: 'FILE_TOO_LARGE',
      }));
    }
    if (error instanceof multer.MulterError) {
      return next(new AppError('Invalid multipart file upload', 400, {
        code: 'FILE_UPLOAD_ERROR',
        details: [{ field: error.field, reason: error.code }],
      }));
    }
    return next(error);
  });
};

const requireWorkbook = (req, _res, next) => {
  if (!req.file) {
    return next(new AppError('Spreadsheet file is required in the file field', 400, {
      code: 'FILE_REQUIRED',
    }));
  }
  return next();
};

module.exports = {
  CSV_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  requireWorkbook,
  uploadCandidateWorkbook,
  XLSX_MIME_TYPE,
};
