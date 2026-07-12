process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert/strict');
const createApp = require('../src/app');
const Candidate = require('../src/modules/candidates/candidate.model');
const User = require('../src/modules/auth/user.model');
const jwt = require('jsonwebtoken');
const env = require('../src/config/env');

const USER_ID = '000000000000000000000001';
const ADMIN_ID = '000000000000000000000002';

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

test('User Management is protected beneath the legacy API prefix', async () => {
  const server = await startTestServer();
  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/v1/users`);
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.error.code, 'AUTH_TOKEN_REQUIRED');
  } finally {
    await stopTestServer(server);
  }
});

test('all dashboard endpoints are public and return standard envelopes', async () => {
  const originalAggregate = Candidate.aggregate;
  Candidate.aggregate = async (pipeline) => {
    const serialized = JSON.stringify(pipeline);
    if (serialized.includes('totalCandidates')) return [{ totalCandidates: 12, activeCandidates: 10 }];
    if (serialized.includes('statusSummary')) return [{ statusSummary: { Registered: 4 } }];
    if (serialized.includes('sourceSummary')) return [{ sourceSummary: { Website: 3 } }];
    if (serialized.includes('monthlyTrend')) return [{ monthlyTrend: [{ month: '2026-07', registrationCount: 2 }] }];
    return [{ candidateId: 'CRTS000012', name: 'Asha Sharma' }];
  };

  const server = await startTestServer();
  try {
    const { port } = server.address();
    const paths = ['summary', 'status-summary', 'source-summary', 'monthly-trend', 'recent'];
    const responses = await Promise.all(paths.map((path) => (
      fetch(`http://127.0.0.1:${port}/api/dashboard/${path}`)
    )));
    const bodies = await Promise.all(responses.map((response) => response.json()));

    responses.forEach((response) => assert.equal(response.status, 200));
    bodies.forEach((body) => assert.equal(body.success, true));
    assert.equal(bodies[0].data.totalCandidates, 12);
    assert.equal(bodies[4].data.recentCandidates[0].candidateId, 'CRTS000012');
  } finally {
    Candidate.aggregate = originalAggregate;
    await stopTestServer(server);
  }
});

test('candidate routes are registered and require authentication', async () => {
  const server = await startTestServer();
  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/candidates`);
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.error.code, 'AUTH_TOKEN_REQUIRED');
  } finally {
    await stopTestServer(server);
  }
});

test('Excel import requires JWT and an Admin role before accepting files', async () => {
  const server = await startTestServer();
  const originalFindById = User.findById;
  try {
    const { port } = server.address();
    const missingToken = await fetch(`http://127.0.0.1:${port}/api/excel/import`, { method: 'POST' });
    assert.equal(missingToken.status, 401);

    User.findById = async () => ({ id: USER_ID, role: 'User', isActive: true });
    const token = jwt.sign({ sub: USER_ID, role: 'User' }, env.jwtSecret, { expiresIn: '5m' });
    const nonAdmin = await fetch(`http://127.0.0.1:${port}/api/excel/import`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
    });
    const body = await nonAdmin.json();
    assert.equal(nonAdmin.status, 403);
    assert.equal(body.error.code, 'FORBIDDEN');
  } finally {
    User.findById = originalFindById;
    await stopTestServer(server);
  }
});

test('Excel import rejects non-spreadsheet uploads after Admin authorization', async () => {
  const server = await startTestServer();
  const originalFindById = User.findById;
  try {
    const { port } = server.address();
    User.findById = async () => ({ id: ADMIN_ID, role: 'Admin', isActive: true });
    const token = jwt.sign({ sub: ADMIN_ID, role: 'Admin' }, env.jwtSecret, { expiresIn: '5m' });
    const form = new FormData();
    form.append('file', new Blob(['not a spreadsheet'], { type: 'text/plain' }), 'candidates.txt');

    const response = await fetch(`http://127.0.0.1:${port}/api/excel/import`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: form,
    });
    const body = await response.json();
    assert.equal(response.status, 415);
    assert.equal(body.error.code, 'UNSUPPORTED_FILE_TYPE');
  } finally {
    User.findById = originalFindById;
    await stopTestServer(server);
  }
});

test('Report endpoints require JWT authentication', async () => {
  const server = await startTestServer();
  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/reports/summary`);
    const body = await response.json();
    assert.equal(response.status, 401);
    assert.equal(body.error.code, 'AUTH_TOKEN_REQUIRED');
  } finally {
    await stopTestServer(server);
  }
});

test('all Report endpoints register for authenticated users', async () => {
  const server = await startTestServer();
  const originalFindById = User.findById;
  const originalAggregate = Candidate.aggregate;
  try {
    const { port } = server.address();
    User.findById = async () => ({ id: USER_ID, role: 'User', isActive: true });
    Candidate.aggregate = async (pipeline) => {
      const serialized = JSON.stringify(pipeline);
      if (serialized.includes('averageExperience')) return [{ totalCandidates: 2 }];
      if (serialized.includes('conversionPercentage')) {
        return [{ pipeline: { Registered: 1, Selected: 1 }, total: 2, conversionPercentage: 50 }];
      }
      if (serialized.includes('registrations')) return [{ month: '2026-07', registrations: 2, selections: 1 }];
      if (serialized.includes('statusSummary')) return [{ statusSummary: { Registered: 1 }, total: 2 }];
      if (serialized.includes('sourceSummary')) return [{ sourceSummary: { Website: 2 }, total: 2 }];
      return [{ candidates: [], total: 0 }];
    };
    const token = jwt.sign({ sub: USER_ID, role: 'User' }, env.jwtSecret, { expiresIn: '5m' });
    const paths = ['summary', 'candidates', 'status', 'source', 'monthly', 'pipeline'];
    const responses = await Promise.all(paths.map((path) => fetch(
      `http://127.0.0.1:${port}/api/reports/${path}`,
      { headers: { authorization: `Bearer ${token}` } },
    )));
    responses.forEach((response) => assert.equal(response.status, 200));
  } finally {
    User.findById = originalFindById;
    Candidate.aggregate = originalAggregate;
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

test('canonical authentication login route is registered and validates input', async () => {
  const server = await startTestServer();
  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'invalid', password: '' }),
    });
    const body = await response.json();

    assert.equal(response.status, 422);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
  } finally {
    await stopTestServer(server);
  }
});

test('protected authentication route rejects a missing JWT', async () => {
  const server = await startTestServer();
  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/profile`);
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.error.code, 'AUTH_TOKEN_REQUIRED');
  } finally {
    await stopTestServer(server);
  }
});

test('signed JWT with an invalid user subject is rejected consistently', async () => {
  const server = await startTestServer();
  try {
    const { port } = server.address();
    const token = jwt.sign({ sub: 'not-an-object-id', role: 'User' }, env.jwtSecret, {
      algorithm: 'HS256',
      expiresIn: '5m',
    });
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/profile`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const body = await response.json();
    assert.equal(response.status, 401);
    assert.equal(body.error.code, 'INVALID_AUTH_TOKEN');
  } finally {
    await stopTestServer(server);
  }
});

test('malformed JSON uses the standard client-error envelope', async () => {
  const server = await startTestServer();
  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{invalid',
    });
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'INVALID_JSON');
  } finally {
    await stopTestServer(server);
  }
});
