'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const Role = require('../src/modules/core/roles/model');
const { authorize, invalidateRoleCache } = require('../src/middlewares/rbac');

function replace(t, target, key, implementation) {
  const original = target[key];
  target[key] = implementation;
  t.after(() => {
    target[key] = original;
    invalidateRoleCache();
  });
}

function run(middleware, req) {
  return new Promise((resolve) => {
    middleware(req, {}, (err) => resolve(err));
  });
}

test('RBAC authorizes granted permissions and denies missing permissions', async (t) => {
  replace(t, Role, 'findById', (id) => ({
    lean: async () => ({
      _id: id,
      permissions: id === 'warehouse-role' ? ['stock:read'] : [],
    }),
  }));

  assert.equal(await run(authorize('stock:read'), { user: { id: 'u1', roleId: 'warehouse-role' } }), undefined);
  const denied = await run(authorize('stock:write'), { user: { id: 'u1', roleId: 'warehouse-role' } });
  assert.equal(denied.status, 403);
});

test('RBAC rejects missing authentication or role context', async () => {
  assert.equal((await run(authorize('products:read'), {})).status, 401);
  assert.equal((await run(authorize('products:read'), { user: { id: 'u1' } })).status, 403);
});

test('tenant role cannot execute platform company and role administration permissions', async (t) => {
  replace(t, Role, 'findById', (id) => ({
    lean: async () => ({
      _id: id,
      permissions: ['companies:read', 'companies:write', 'roles:write'],
    }),
  }));
  const req = { user: { id: 'u1', companyId: 'company-a', roleId: 'tenant-admin' } };
  assert.equal((await run(authorize('companies:read'), req)).status, 403);
  assert.equal((await run(authorize('roles:write'), req)).status, 403);
});
