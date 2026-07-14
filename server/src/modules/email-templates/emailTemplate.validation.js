const { body } = require('express-validator');

const createTemplateValidation = [
  body('name').trim().notEmpty().withMessage('Template name is required').isLength({ max: 100 }).withMessage('Name must be less than 100 characters'),
  body('subject').trim().notEmpty().withMessage('Subject is required').isLength({ max: 200 }).withMessage('Subject must be less than 200 characters'),
  body('htmlBody').trim().notEmpty().withMessage('HTML Body is required'),
];

const updateTemplateValidation = [
  body('name').optional().trim().notEmpty().withMessage('Template name is required').isLength({ max: 100 }).withMessage('Name must be less than 100 characters'),
  body('subject').optional().trim().notEmpty().withMessage('Subject is required').isLength({ max: 200 }).withMessage('Subject must be less than 200 characters'),
  body('htmlBody').optional().trim().notEmpty().withMessage('HTML Body is required'),
];

module.exports = {
  createTemplateValidation,
  updateTemplateValidation,
};
