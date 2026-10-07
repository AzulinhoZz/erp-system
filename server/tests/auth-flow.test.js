'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');

process.env.JWT_ACCESS_SECRET = 'auth-flow-test-access-secret-at-least-32';
process.env.JWT_REFRESH_SECRET = 'auth-flow-test-refresh-secret-at-least-32';

const jwt = require('jsonwebtoken');
const User = require('../src/modules/core/users/model');
const Role = require('../src/modules/core/roles/model');
const Company = require('../src/modules/core/companies/model');
const authService = require('../src/modules/core/auth/service');
const { ApiError } = require('../src/middlewares/errorHandler');

function replace(t, target, key, implementation) {
  const original = target[key];
  target[key] = implementation;
  t.after(() => { target[key] = original; });
}

function queryResult(value) {
  return {
    select() { return this; },
    populate() { return this; },
    then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); },
  };
}

test('login signs access and refresh tokens only for an active user', async (t) => {
  const passwordHash = await bcrypt.hash('Correct-Horse-1', 4);
  const user = {
    _id: { toString: () => 'user-1' },
    name: 'Test User',
    email: 'test@example.test',
    passwordHash,
    companyId: { _id: 'company-1', name: 'Test company' },
    roleId: 'role-1',
  };
  let query;
  replace(t, User, 'findOne', (value) => { query = value; return queryResult(user); });
  replace(t, Role, 'findById', () => ({ lean: async () => ({
    _id: { toString: () => 'role-1' },
    name: 'Reader',
    permissions: ['products:read'],
  }) }));

  const result = await authService.login({ email: user.email, password: 'Correct-Horse-1' });
  assert.deepEqual(query, { email: user.email, isActive: true });
  assert.equal(jwt.verify(result.accessToken, process.env.JWT_ACCESS_SECRET).sub, 'user-1');
  assert.equal(jwt.verify(result.refreshToken, process.env.JWT_REFRESH_SECRET).sub, 'user-1');
  assert.equal(result.user.companyId, 'company-1');
  assert.equal(Object.hasOwn(result.user, 'passwordHash'), false);
});

test('login rejects bad credentials', async (t) => {
  replace(t, User, 'findOne', () => queryResult(null));
  await assert.rejects(
    authService.login({ email: 'missing@example.test', password: 'wrong' }),
    (err) => err instanceof ApiError && err.status === 401
  );
});

test('refresh rotates tokens and rejects inactive users', async (t) => {
  const refreshToken = jwt.sign(
    { sub: 'user-2', companyId: 'company-2', roleId: 'role-2' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '5m' }
  );
  const user = {
    _id: { toString: () => 'user-2' },
    name: 'Active',
    email: 'active@example.test',
    companyId: 'company-2',
    roleId: 'role-2',
  };
  replace(t, User, 'findOne', async () => user);
  replace(t, Role, 'findById', () => ({ lean: async () => ({
    _id: { toString: () => 'role-2' },
    name: 'Reader',
    permissions: [],
  }) }));

  const result = await authService.refresh(refreshToken);
  assert.equal(jwt.verify(result.accessToken, process.env.JWT_ACCESS_SECRET).sub, 'user-2');
  assert.notEqual(result.refreshToken, refreshToken);

  replace(t, User, 'findOne', async () => null);
  await assert.rejects(
    authService.refresh(refreshToken),
    (err) => err instanceof ApiError && err.status === 401
  );
});

test('platform company switch issues tokens and profile for the selected tenant', async (t) => {
  const user = {
    _id: { toString: () => 'platform-user' },
    name: 'Platform Admin',
    email: 'platform@example.test',
    companyId: 'home-company',
    roleId: 'platform-role',
  };
  replace(t, User, 'findOne', async () => user);
  replace(t, Role, 'findById', () => ({ lean: async () => ({
    _id: { toString: () => 'platform-role' },
    name: 'Super Admin',
    permissions: ['*'],
  }) }));
  replace(t, Company, 'findById', async () => ({
    _id: 'selected-company',
    name: 'Selected Company',
    taxId: 'RFC-TEST',
  }));

  const result = await authService.switchCompany('platform-user', 'selected-company');
  assert.equal(jwt.verify(result.accessToken, process.env.JWT_ACCESS_SECRET).companyId, 'selected-company');
  assert.equal(result.user.companyId, 'selected-company');
  assert.equal(result.company.name, 'Selected Company');
});

test('non-platform user cannot switch company context', async (t) => {
  replace(t, User, 'findOne', async () => ({
    _id: 'user-tenant',
    roleId: 'tenant-role',
    companyId: 'company-a',
  }));
  replace(t, Role, 'findById', () => ({ lean: async () => ({
    _id: 'tenant-role',
    permissions: ['companies:read'],
  }) }));

  await assert.rejects(
    authService.switchCompany('user-tenant', 'company-b'),
    (err) => err instanceof ApiError && err.status === 403
  );
});
