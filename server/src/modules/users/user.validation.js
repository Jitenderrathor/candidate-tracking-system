const { param } = require('express-validator');

const userIdValidation = [param('userId').isMongoId()];

module.exports = { userIdValidation };

