process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert/strict');
const { startServer } = require('../src/server');

test('server entry point starts and serves requests after database connection', async () => {
  let databaseConnected = false;
  const server = await startServer({
    connect: async () => { databaseConnected = true; },
    port: 0,
  });

  try {
    await new Promise((resolve) => {
      if (server.listening) resolve();
      else server.once('listening', resolve);
    });
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/health`);

    assert.equal(databaseConnected, true);
    assert.equal(response.status, 200);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
