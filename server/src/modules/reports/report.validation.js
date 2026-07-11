const { query } = require('express-validator');

const dateRangeValidation = [
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
];

module.exports = { dateRangeValidation };

