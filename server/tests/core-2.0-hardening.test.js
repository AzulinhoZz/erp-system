'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const usersController = require('../src/modules/core/users/controller');
const rolesController = require('../src/modules/core/roles/controller');
const productsController = require('../src/modules/inventario/products/controller');

function responseSpy() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('tenant isolation: users list must ignore client-supplied companyId', async () => {
  const service = require('../src/modules/core/users/service');
  const original = service.list;
  let args;
  service.list = async (input) => { args = input; return { items: [], total: 0 }; };

  try {
    const req = {
      user: { id: 'user-a', companyId: 'company-a' },
      query: { companyId: 'company-b', q: 'alice' },
    };
    await usersController.list(req, responseSpy(), (err) => { if (err) throw err; });
    assert.equal(args.companyId, 'company-a');
  } finally {
    service.list = original;
  }
});

test('tenant isolation: creating a user must derive companyId from authenticated context', async () => {
  const service = require('../src/modules/core/users/service');
  const original = service.create;
  let data;
  service.create = async (input) => { data = input; return input; };

  try {
    const req = {
      user: { id: 'admin-a', companyId: 'company-a' },
      body: { name: 'Eve', email: 'eve@example.com', password: 'secret', roleId: 'role-a', companyId: 'company-b' },
    };
    await usersController.create(req, responseSpy(), (err) => { if (err) throw err; });
    assert.equal(data.companyId, 'company-a');
  } finally {
    service.create = original;
  }
});

test('tenant isolation: reading/updating a user must carry authenticated company context', async () => {
  const service = require('../src/modules/core/users/service');
  const originalGet = service.getById;
  const originalUpdate = service.update;
  let getArgs;
  let updateArgs;
  service.getById = async (...input) => { getArgs = input; return {}; };
  service.update = async (...input) => { updateArgs = input; return {}; };

  try {
    const req = {
      user: { id: 'admin-a', companyId: 'company-a' },
      params: { id: 'user-b' },
      body: { name: 'changed', companyId: 'company-b' },
    };
    await usersController.getById(req, responseSpy(), (err) => { if (err) throw err; });
    await usersController.update(req, responseSpy(), (err) => { if (err) throw err; });

    assert.equal(getArgs[1], 'company-a');
    assert.equal(updateArgs[2], 'company-a');
    assert.notEqual(updateArgs[1].companyId, 'company-b');
  } finally {
    service.getById = originalGet;
    service.update = originalUpdate;
  }
});

test('RBAC separation: a company Admin cannot create a platform role', async () => {
  const service = require('../src/modules/core/roles/service');
  const original = service.create;
  let called = false;
  service.create = async () => { called = true; return {}; };

  try {
    const req = {
      user: { id: 'admin-a', roleId: 'admin-role', companyId: 'company-a' },
      authz: { role: { name: 'Admin', permissions: ['roles:read', 'roles:write'], isPlatform: false } },
      body: { name: 'Platform Clone', permissions: ['*'] },
    };
    const res = responseSpy();
    let nextError;
    await rolesController.create(req, res, (err) => { nextError = err; });

    assert.equal(called, false);
    assert.equal(nextError?.status, 403);
  } finally {
    service.create = original;
  }
});


test('tenant isolation: product list ignores client-supplied companyId', async () => {
  const controller = productsController;
  const service = require('../src/modules/inventario/products/service');
  const original = service.list;
  let args;
  service.list = async (input) => { args = input; return { items: [], total: 0 }; };
  try {
    await controller.list({
      user: { companyId: 'company-a' },
      query: { companyId: 'company-b', q: 'SKU' },
    }, responseSpy(), (err) => { if (err) throw err; });
    assert.equal(args.companyId, 'company-a');
  } finally { service.list = original; }
});

test('tenant integrity: invoice creation uses authenticated company context', async () => {
  const controller = require('../src/modules/ventas/invoices/controller');
  const service = require('../src/modules/ventas/invoices/service');
  const original = service.create;
  let args;
  service.create = async (input) => { args = input; return input; };
  try {
    await controller.create({
      user: { companyId: 'company-a' },
      body: { salesOrderId: 'so-a', companyId: 'company-b', dueDate: '2026-09-30' },
    }, responseSpy(), (err) => { if (err) throw err; });
    assert.equal(args.companyId, 'company-a');
  } finally { service.create = original; }
});

test('tenant isolation: notification read cannot target another company', async () => {
  const controller = require('../src/modules/notificaciones/notifications/controller');
  const service = require('../src/modules/notificaciones/notifications/service');
  const original = service.markRead;
  let args;
  service.markRead = async (...input) => { args = input; return {}; };
  try {
    await controller.markRead({
      user: { companyId: 'company-a' },
      params: { id: 'notification-b' },
    }, responseSpy(), (err) => { if (err) throw err; });
    assert.equal(args[1], 'company-a');
  } finally { service.markRead = original; }
});
