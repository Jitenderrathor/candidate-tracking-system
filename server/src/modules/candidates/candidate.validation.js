const { param } = require('express-validator');

const candidateIdValidation = [param('candidateId').isMongoId()];

module.exports = { candidateIdValidation };

