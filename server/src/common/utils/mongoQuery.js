const mongoose = require('mongoose');
const env = require('../../config/env');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const documentLookup = (value, publicIdField) => (
  mongoose.isValidObjectId(value) ? { _id: value } : { [publicIdField]: value }
);

const executeAggregation = (Model, pipeline) => {
  const aggregation = Model.aggregate(pipeline);
  return typeof aggregation.option === 'function'
    ? aggregation.option({ maxTimeMS: env.mongoQueryMaxTimeMs })
    : aggregation;
};

module.exports = { documentLookup, escapeRegex, executeAggregation };
