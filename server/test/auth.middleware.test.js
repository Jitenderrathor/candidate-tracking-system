process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert/strict');
const { adminOnly, userOrAdmin } = require('../src/modules/auth/auth.middleware');

const runRoleMiddleware = (middleware, user) => new Promise((resolve) => {
  middleware({ user }, {}, (error) => resolve(error));
});

test('adminOnly permits Admin and rejects User', async () => {
  assert.equal(await runRoleMiddleware(adminOnly, { role: 'Admin' }), undefined);
  const error = await runRoleMiddleware(adminOnly, { role: 'User' });
  assert.equal(error.statusCode, 403);
  assert.equal(error.code, 'FORBIDDEN');
});

test('userOrAdmin permits both supported roles', async () => {
  assert.equal(await runRoleMiddleware(userOrAdmin, { role: 'Admin' }), undefined);
  assert.equal(await runRoleMiddleware(userOrAdmin, { role: 'User' }), undefined);
});
