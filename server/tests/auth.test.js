'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_ACCESS_SECRET = 'test-access-secret-that-is-long-enough';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-that-is-long-enough';
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/test';

const jwt = require('jsonwebtoken');
const { authenticate } = require('../src/middlewares/auth');

function runAuth(req) {
  return new Promise((resolve) => {
    authenticate(req, {}, (err) => resolve(err));
  });
}

test('authenticate overwrites request companyId with tenant from JWT', async () => {
  const token = jwt.sign(
    { sub: 'user-1', companyId: 'company-a', roleId: 'role-1' },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '5m' }
  );
  const req = {
    headers: { authorization: `Bearer ${token}` },
    body: { companyId: 'company-b', name: 'attempted override' },
    query: { companyId: 'company-b' },
  };

  const err = await runAuth(req);
  assert.equal(err, undefined);
  assert.equal(req.user.companyId, 'company-a');
  assert.equal(req.body.companyId, 'company-a');
  assert.equal(req.query.companyId, 'company-a');
});

test('authenticate rejects malformed bearer tokens', async () => {
  const req = { headers: { authorization: 'Bearer invalid' }, body: {}, query: {} };
  const err = await runAuth(req);
  assert.equal(err.status, 401);
});
