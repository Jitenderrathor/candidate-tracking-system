const { body } = require('express-validator');

const importOptionsValidation = [body('dryRun').optional().isBoolean()];

module.exports = { importOptionsValidation };

