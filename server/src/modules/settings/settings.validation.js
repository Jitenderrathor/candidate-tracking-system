const { body } = require('express-validator');

const updateSettingsValidation = [
  body('smtpFromName')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('SMTP From Name is required')
    .isLength({ max: 100 }),
  body('smtpFromEmail')
    .optional()
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('A valid email address is required for SMTP From Email')
    .isLength({ max: 254 }),
  body('defaultCc')
    .optional()
    .trim()
    .isString(),
  body('defaultBcc')
    .optional()
    .trim()
    .isString(),
  body('smtpHost')
    .optional()
    .trim()
    .isString(),
  body('smtpPort')
    .optional()
    .isInt({ min: 1, max: 65535 }),
  body('smtpUser')
    .optional()
    .trim()
    .isString(),
  body('smtpPass')
    .optional()
    .isString(),
];

module.exports = {
  updateSettingsValidation,
};
