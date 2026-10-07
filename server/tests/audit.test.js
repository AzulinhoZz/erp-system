'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const AuditLog = require('../src/modules/notificaciones/auditLog/model');
const { audit } = require('../src/middlewares/audit');

test('successful mutations record tenant/user context with sensitive values redacted', async (t) => {
  let entry;
  const originalCreate = AuditLog.create;
  AuditLog.create = async (value) => { entry = value; return value; };
  t.after(() => { AuditLog.create = originalCreate; });

  let finish;
  const req = {
    method: 'POST',
    path: '/api/v1/products',
    originalUrl: '/api/v1/products?debug=1',
    body: { name: 'Widget', password: 'not-recorded', refreshToken: 'not-recorded-either' },
    user: { id: 'user-a', companyId: 'company-a' },
    ip: '127.0.0.1',
  };
  const res = {
    statusCode: 201,
    socket: { remoteAddress: '127.0.0.1' },
    on(event, callback) { if (event === 'finish') finish = callback; },
  };
  let nextCalled = false;
  audit(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
  finish();
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(entry.userId, 'user-a');
  assert.equal(entry.companyId, 'company-a');
  assert.equal(entry.entity, 'products');
  assert.equal(entry.path, '/api/v1/products');
  assert.doesNotMatch(entry.details, /not-recorded/);
  assert.doesNotMatch(entry.details, /not-recorded-either/);
  assert.match(entry.details, /redacted/);
});

test('failed mutations and auth endpoints do not create audit entries', async (t) => {
  let calls = 0;
  const originalCreate = AuditLog.create;
  AuditLog.create = async () => { calls += 1; };
  t.after(() => { AuditLog.create = originalCreate; });

  for (const req of [
    { method: 'POST', path: '/api/v1/products', originalUrl: '/api/v1/products', body: {} },
    { method: 'POST', path: '/api/v1/auth/login', originalUrl: '/api/v1/auth/login', body: {} },
  ]) {
    let finish;
    const res = {
      statusCode: req.path.endsWith('/products') ? 403 : 200,
      on(_event, callback) { finish = callback; },
    };
    audit(req, res, () => {});
    finish();
  }
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls, 0);
});
