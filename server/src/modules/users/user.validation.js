const mongoose = require('mongoose');
const { body, param, query } = require('express-validator');

const ROLES = ['Admin', 'User'];
const STATUSES = ['active', 'inactive'];
const SORTS = ['name', '-name', 'fullName', '-fullName', 'createdAt', '-createdAt'];

const passwordRules = (field) => body(field)
  .isString()
  .isLength({ min: 8, max: 72 }).withMessage('Password must be between 8 and 72 characters')
  .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
  .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
  .matches(/\d/).withMessage('Password must contain a number')
  .matches(/[^A-Za-z0-9]/).withMessage('Password must contain a special character');

const userIdValidation = [
  param('id').custom((value) => {
    if (!mongoose.isValidObjectId(value)) throw new Error('User ID must be a valid MongoDB ID');
    return true;
  }),
];

const listUsersValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 500 }).toInt(),
  query('search').optional().isString().trim().isLength({ max: 100 }),
  query('role').optional().isIn(ROLES).withMessage('Role is invalid'),
  query('status').optional().isIn(STATUSES).withMessage('Status must be active or inactive'),
  query('sort').optional().isIn(SORTS).withMessage('Sort value is invalid'),
];

const createUserValidation = [
  body('fullName').isString().trim().notEmpty().isLength({ max: 100 })
    .withMessage('Full name is required and cannot exceed 100 characters'),
  body('email').trim().isEmail().normalizeEmail().withMessage('A valid email is required'),
  body('role').isIn(ROLES).withMessage('Role is invalid'),
  body('permissions').optional().isArray().withMessage('Permissions must be an array of strings'),
  body('permissions.*').isString().withMessage('Each permission must be a string'),
  passwordRules('password'),
];

const updateUserValidation = [
  body('password').not().exists().withMessage('Password cannot be updated through this endpoint'),
  body('isActive').not().exists().withMessage('Status must be updated through activate or deactivate'),
  body('fullName').optional().isString().trim().notEmpty().isLength({ max: 100 }),
  body('email').optional().trim().isEmail().normalizeEmail(),
  body('role').optional().isIn(ROLES).withMessage('Role is invalid'),
  body('permissions').optional().isArray().withMessage('Permissions must be an array of strings'),
  body('permissions.*').isString().withMessage('Each permission must be a string'),
  body().custom((value) => {
    if (!['fullName', 'email', 'role', 'permissions'].some((field) => value[field] !== undefined)) {
      throw new Error('At least one editable field is required');
    }
    return true;
  }),
];

module.exports = {
  createUserValidation,
  listUsersValidation,
  updateUserValidation,
  userIdValidation,
};
