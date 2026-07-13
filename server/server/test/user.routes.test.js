process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const createApp = require('../src/app');
const env = require('../src/config/env');
const User = require('../src/modules/auth/user.model');

const USER_ID = '000000000000000000000001';

const startServer = () => new Promise((resolve) => {
  const server = createApp().listen(0, () => resolve(server));
});
const stopServer = (server) => new Promise((resolve, reject) => {
  server.close((error) => (error ? reject(error) : resolve()));
});

test('canonical User Management routes require authentication', async () => {
  const server = await startServer();
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/users`);
    const body = await response.json();
    assert.equal(response.status, 401);
    assert.equal(body.error.code, 'AUTH_TOKEN_REQUIRED');
  } finally {
    await stopServer(server);
  }
});

test('User role cannot access User Management routes', async () => {
  const originalFindById = User.findById;
  const server = await startServer();
  try {
    User.findById = async () => ({ id: USER_ID, role: 'User', isActive: true });
    const token = jwt.sign({ sub: USER_ID, role: 'User' }, env.jwtSecret, { expiresIn: '5m' });
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/users`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const body = await response.json();
    assert.equal(response.status, 403);
    assert.equal(body.error.code, 'FORBIDDEN');
  } finally {
    User.findById = originalFindById;
    await stopServer(server);
  }
});
