const mongoose = require('mongoose');
const env = require('./env');

const TRANSACTION_OPTIONS = Object.freeze({
  readConcern: { level: 'snapshot' },
  writeConcern: { w: 'majority' },
});

const connectDatabase = async () => {
  await mongoose.connect(env.mongoUri, {
    autoIndex: env.nodeEnv !== 'production',
    maxPoolSize: env.mongoMaxPoolSize,
    serverSelectionTimeoutMS: env.mongoServerSelectionTimeoutMs,
  });
  console.info('MongoDB connected');
};

const disconnectDatabase = async () => {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
};

module.exports = { connectDatabase, disconnectDatabase, TRANSACTION_OPTIONS };
