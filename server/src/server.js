const createApp = require('./app');
const env = require('./config/env');
const { connectDatabase, disconnectDatabase } = require('./config/database');

const app = createApp();
let server;
let shuttingDown = false;

const startServer = async ({ connect = connectDatabase, port = env.port } = {}) => {
  await connect();
  server = app.listen(port, () => {
    const address = server.address();
    const activePort = typeof address === 'object' && address ? address.port : port;
    console.log(`API listening on port ${activePort} (${env.nodeEnv})`);
  });
  return server;
};

const closeHttpServer = () => new Promise((resolve, reject) => {
  if (!server?.listening) return resolve();
  return server.close((error) => (error ? reject(error) : resolve()));
});

const shutdown = async (signal, exitCode = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.info(`${signal} received; closing services`);

  const forceExitTimer = setTimeout(() => {
    console.error('Graceful shutdown timed out');
    process.exit(1);
  }, env.shutdownTimeoutMs);
  forceExitTimer.unref();

  try {
    await closeHttpServer();
    await disconnectDatabase();
    clearTimeout(forceExitTimer);
    process.exit(exitCode);
  } catch (error) {
    clearTimeout(forceExitTimer);
    console.error('Graceful shutdown failed', error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection', error);
    shutdown('unhandledRejection', 1);
  });
  process.once('uncaughtException', (error) => {
    console.error('Uncaught exception', error);
    shutdown('uncaughtException', 1);
  });
  const { scheduleTrashCleanup } = require('./config/cron');
  startServer().then(() => {
    scheduleTrashCleanup();
  }).catch((error) => {
    console.error('Server startup failed', error);
    shutdown('startupFailure', 1);
  });
}

module.exports = { shutdown, startServer };
