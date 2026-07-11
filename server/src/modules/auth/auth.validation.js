const { body } = require('express-validator');

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isString().notEmpty(),
];

module.exports = { loginValidation };

