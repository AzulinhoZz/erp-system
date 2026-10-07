'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');

const Product = require('../src/modules/inventario/products/model');
const productService = require('../src/modules/inventario/products/service');
const User = require('../src/modules/core/users/model');
const Role = require('../src/modules/core/roles/model');
const userService = require('../src/modules/core/users/service');
const { ApiError } = require('../src/middlewares/errorHandler');

function replace(t, target, key, implementation) {
  const original = target[key];
  target[key] = implementation;
  t.after(() => { target[key] = original; });
}

test('products list is active-only, company-scoped, and bounded', async (t) => {
  let receivedQuery;
  let receivedLimit;
  replace(t, Product, 'find', (query) => {
    receivedQuery = query;
    return {
      sort() { return this; },
      skip() { return this; },
      limit(limit) { receivedLimit = limit; return Promise.resolve([{ sku: 'A-1' }]); },
    };
  });
  replace(t, Product, 'countDocuments', async () => 1);

  const result = await productService.list({ companyId: 'company-a', page: 2, limit: 500 });
  assert.deepEqual(receivedQuery, {
    isActive: { $ne: false },
    companyId: 'company-a',
  });
  assert.equal(receivedLimit, 100);
  assert.equal(result.page, 2);
  assert.equal(result.limit, 100);
  assert.equal(result.total, 1);
});

test('product creation rejects client-supplied opening stock and only stores allowlisted fields', async (t) => {
  let created;
  replace(t, Product, 'findOne', async () => null);
  replace(t, Product, 'create', async (body) => { created = body; return body; });

  await assert.rejects(
    productService.create({ sku: 'a-1', name: 'Widget', companyId: 'company-a', stock: 20 }),
    (err) => err instanceof ApiError && err.status === 400
  );
  await productService.create({
    sku: 'a-1',
    name: 'Widget',
    companyId: 'company-a',
    stock: 0,
    isActive: false,
    unexpected: 'not stored',
  });
  assert.equal(created.stock, 0);
  assert.equal(created.isActive, true);
  assert.equal(Object.hasOwn(created, 'unexpected'), false);
});

test('duplicate product SKU is a conflict within the authenticated company', async (t) => {
  let query;
  replace(t, Product, 'findOne', async (value) => {
    query = value;
    return { _id: 'existing-product' };
  });
  await assert.rejects(
    productService.create({ sku: 'a-1', name: 'Widget', companyId: 'company-a' }),
    (err) => err instanceof ApiError && err.status === 409
  );
  assert.deepEqual(query, { sku: 'A-1', companyId: 'company-a' });
});

test('product update and deactivation always scope by tenant and never alter stock', async (t) => {
  const queries = [];
  replace(t, Product, 'findOneAndUpdate', async (query, update) => {
    queries.push({ query, update });
    return { _id: 'product-a', ...update };
  });
  await productService.update('product-a', {
    name: 'Changed',
    stock: 999,
    companyId: 'company-b',
    isActive: false,
  }, 'company-a');
  await productService.deactivate('product-a', 'company-a');

  assert.deepEqual(queries[0], {
    query: { _id: 'product-a', isActive: { $ne: false }, companyId: 'company-a' },
    update: { name: 'Changed' },
  });
  assert.deepEqual(queries[1], {
    query: { _id: 'product-a', isActive: { $ne: false }, companyId: 'company-a' },
    update: { isActive: false },
  });
});

test('company A cannot read, update, or deactivate company B product', async (t) => {
  const queries = [];
  replace(t, Product, 'findOne', async (query) => {
    queries.push(query);
    return null;
  });
  replace(t, Product, 'findOneAndUpdate', async (query) => {
    queries.push(query);
    return null;
  });

  await assert.rejects(
    productService.getById('product-b', 'company-a'),
    (err) => err instanceof ApiError && err.status === 404
  );
  await assert.rejects(
    productService.update('product-b', { name: 'Takeover' }, 'company-a'),
    (err) => err instanceof ApiError && err.status === 404
  );
  await assert.rejects(
    productService.deactivate('product-b', 'company-a'),
    (err) => err instanceof ApiError && err.status === 404
  );
  assert.deepEqual(queries, [
    { _id: 'product-b', isActive: { $ne: false }, companyId: 'company-a' },
    { _id: 'product-b', isActive: { $ne: false }, companyId: 'company-a' },
    { _id: 'product-b', isActive: { $ne: false }, companyId: 'company-a' },
  ]);
});

test('tenant user creation forces companyId and hashes password', async (t) => {
  let created;
  replace(t, Role, 'findById', async () => ({ permissions: ['products:read'] }));
  replace(t, User, 'create', async (data) => { created = data; return data; });

  const result = await userService.create({
    name: 'Tenant user',
    email: 'tenant@example.test',
    password: 'A-safe-password-1',
    passwordHash: 'attacker-controlled-hash',
    companyId: 'company-b',
    roleId: 'role-user',
  }, { companyId: 'company-a' });

  assert.equal(created.companyId, 'company-a');
  assert.notEqual(created.passwordHash, 'A-safe-password-1');
  assert.notEqual(created.passwordHash, 'attacker-controlled-hash');
  assert.equal(await bcrypt.compare('A-safe-password-1', created.passwordHash), true);
  assert.equal(result.password, undefined);
});

test('user update allowlists editable fields and protects tenant and credential fields', async (t) => {
  let query;
  const user = {
    name: 'Before',
    companyId: 'company-a',
    passwordHash: 'existing-hash',
    async save() { this.saved = true; },
  };
  replace(t, User, 'findOne', async (value) => { query = value; return user; });

  await userService.update('user-b', {
    name: 'After',
    companyId: 'company-b',
    passwordHash: 'attacker-hash',
    isActive: true,
  }, { companyId: 'company-a' });
  assert.deepEqual(query, { _id: 'user-b', companyId: 'company-a' });
  assert.equal(user.name, 'After');
  assert.equal(user.companyId, 'company-a');
  assert.equal(user.passwordHash, 'existing-hash');
  assert.equal(user.saved, true);
});

test('tenant user cannot be assigned a wildcard role', async (t) => {
  replace(t, Role, 'findById', async (id) => (
    id === 'role-admin' ? { permissions: ['*'] } : { permissions: ['users:read'] }
  ));
  await assert.rejects(
    userService.create({
      name: 'Escalation',
      email: 'escalation@example.test',
      password: 'A-safe-password-1',
      roleId: 'role-admin',
      companyId: 'company-a',
    }, { companyId: 'company-a' }),
    (err) => err instanceof ApiError && err.status === 403
  );
});

test('company user cannot assign platform-level company or role administration', async (t) => {
  replace(t, Role, 'findById', async () => ({
    permissions: ['users:read', 'companies:write', 'roles:write'],
  }));
  await assert.rejects(
    userService.create({
      name: 'Platform escalation',
      email: 'platform@example.test',
      password: 'A-safe-password-1',
      roleId: 'role-platform',
      companyId: 'company-a',
    }, { companyId: 'company-a' }),
    (err) => err instanceof ApiError && err.status === 403
  );
});

test('user deactivation is tenant-scoped and prevents self-lockout', async (t) => {
  let query;
  const user = {
    _id: 'user-b',
    companyId: 'company-a',
    isActive: true,
    async save() { this.saved = true; },
  };
  replace(t, User, 'findOne', async (value) => { query = value; return user; });

  await userService.deactivate('user-b', { userId: 'actor-a', companyId: 'company-a' });
  assert.deepEqual(query, { _id: 'user-b', companyId: 'company-a' });
  assert.equal(user.isActive, false);
  assert.equal(user.saved, true);
  await assert.rejects(
    userService.deactivate('actor-a', { userId: 'actor-a', companyId: 'company-a' }),
    (err) => err instanceof ApiError && err.status === 409
  );
});

test('user detail lookup is scoped to the authenticated company', async (t) => {
  let query;
  replace(t, User, 'findOne', (value) => {
    query = value;
    const result = Promise.resolve(null);
    result.populate = () => result;
    return result;
  });
  await assert.rejects(
    userService.getById('user-from-company-b', { companyId: 'company-a' }),
    (err) => err instanceof ApiError && err.status === 404
  );
  assert.deepEqual(query, { _id: 'user-from-company-b', companyId: 'company-a' });
});

test('user JSON serialization never exposes passwordHash', () => {
  const user = new User({
    name: 'Private User',
    email: 'private@example.test',
    passwordHash: 'secret-hash',
    roleId: '507f1f77bcf86cd799439011',
    companyId: '507f191e810c19729de860ea',
  });
  assert.equal(Object.hasOwn(user.toJSON(), 'passwordHash'), false);
  assert.equal(User.schema.path('passwordHash').options.select, false);
});
