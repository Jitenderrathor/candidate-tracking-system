const createApp = require('./app');
const env = require('./config/env');

const app = createApp();
const server = app.listen(env.port, () => {
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : env.port;
  console.log(`API listening on port ${port} (${env.nodeEnv})`);
});

const shutdown = (signal) => {
  console.log(`${signal} received; closing HTTP server`);
  server.close((error) => {
    if (error) {
      console.error('HTTP server shutdown failed', error);
      process.exit(1);
    }
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = server;

