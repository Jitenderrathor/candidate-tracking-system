const { query } = require('express-validator');

const activityLogQueryValidation = [query('limit').optional().isInt({ min: 1, max: 100 }).toInt()];

module.exports = { activityLogQueryValidation };

