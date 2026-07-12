const { body } = require('express-validator');

const loginValidation = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isString().notEmpty().withMessage('Password is required'),
];

const passwordRules = (field) => body(field)
  .isString()
  .isLength({ min: 8, max: 72 })
  .withMessage('Password must be between 8 and 72 characters')
  .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
  .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
  .matches(/\d/).withMessage('Password must contain a number')
  .matches(/[^A-Za-z0-9]/).withMessage('Password must contain a special character');

const changePasswordValidation = [
  body('oldPassword').isString().notEmpty().withMessage('Old password is required'),
  passwordRules('newPassword'),
  body('newPassword').custom((value, { req }) => {
    if (value === req.body.oldPassword) throw new Error('New password must differ from old password');
    return true;
  }),
];

const forgotPasswordValidation = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
];

const resetPasswordValidation = [
  body('token').isString().trim().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  passwordRules('newPassword'),
];

module.exports = {
  changePasswordValidation,
  forgotPasswordValidation,
  loginValidation,
  resetPasswordValidation,
};
