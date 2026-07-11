const { body } = require('express-validator');

const transitionValidation = [body('toStatus').isString().trim().notEmpty()];

module.exports = { transitionValidation };

