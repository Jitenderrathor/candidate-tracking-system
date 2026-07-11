process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert/strict');
const createApp = require('../src/app');

const startTestServer = () => new Promise((resolve) => {
  const server = createApp().listen(0, () => resolve(server));
});

const stopTestServer = (server) => new Promise((resolve, reject) => {
  server.close((error) => (error ? reject(error) : resolve()));
});

test('health endpoint returns the standard success envelope', async () => {
  const server = await startTestServer();
  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.environment, 'test');
  } finally {
    await stopTestServer(server);
  }
});

test('registered modules are reachable beneath the API prefix', async () => {
  const server = await startTestServer();
  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/v1/candidates`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.data.module, 'candidates');
    assert.equal(body.data.implementationStatus, 'scaffolded');
  } finally {
    await stopTestServer(server);
  }
});

test('unknown routes use the centralized error envelope', async () => {
  const server = await startTestServer();
  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/missing`);
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'ROUTE_NOT_FOUND');
  } finally {
    await stopTestServer(server);
  }
});

