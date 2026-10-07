'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const Product = require('../src/modules/inventario/products/model');
const Branch = require('../src/modules/core/branches/model');
const Warehouse = require('../src/modules/inventario/warehouses/model');
const StockMovement = require('../src/modules/inventario/stockMovements/model');
const movementService = require('../src/modules/inventario/stockMovements/service');
const { ApiError } = require('../src/middlewares/errorHandler');

function replace(t, target, key, implementation) {
  const original = target[key];
  target[key] = implementation;
  t.after(() => { target[key] = original; });
}

function createDbHarness(t, { initialStock = 20, failMovementInsert = false } = {}) {
  const state = {
    product: {
      _id: 'product-a',
      companyId: 'company-a',
      sku: 'A-1',
      name: 'Test product',
      stock: initialStock,
      minStock: 0,
      isActive: true,
      toObject() { return { ...this }; },
    },
    movements: [],
    failMovementInsert,
  };

  replace(t, mongoose, 'startSession', async () => ({
    async withTransaction(callback) {
      const stock = state.product.stock;
      const movements = [...state.movements];
      try {
        await callback();
      } catch (err) {
        state.product.stock = stock;
        state.movements = movements;
        throw err;
      }
    },
    async endSession() {},
  }));
  replace(t, Product, 'findOne', (query) => ({
    session: async () => {
      if (
        String(query.companyId || state.product.companyId) !== String(state.product.companyId) ||
        String(query._id) !== String(state.product._id) ||
        (query.isActive?.$ne === false && state.product.isActive === false)
      ) return null;
      return {
        ...state.product,
        stock: state.product.stock,
        toObject() { return { ...this }; },
      };
    },
  }));
  replace(t, Product, 'updateOne', async (query, update) => {
    if (
      String(query._id) !== String(state.product._id) ||
      String(query.companyId) !== String(state.product.companyId) ||
      (query.stock && state.product.stock < query.stock.$gte)
    ) return { matchedCount: 0 };
    state.product.stock += update.$inc.stock;
    return { matchedCount: 1 };
  });
  replace(t, Branch, 'find', () => ({
    distinct: () => ({ session: async () => ['branch-a'] }),
  }));
  replace(t, Warehouse, 'findOne', () => ({
    session: async () => ({ _id: 'warehouse-a' }),
  }));
  replace(t, StockMovement, 'create', async ([movement]) => {
    if (state.failMovementInsert) throw new Error('movement insert failed');
    const saved = { _id: `movement-${state.movements.length + 1}`, ...movement };
    state.movements.push(saved);
    return [saved];
  });
  replace(t, StockMovement, 'findOne', (query) => ({
    session: async () => state.movements.find((movement) => String(movement._id) === String(query._id)) || null,
  }));
  replace(t, StockMovement, 'exists', (query) => ({
    session: async () => state.movements.some((movement) => String(movement.reversalOf) === String(query.reversalOf)),
  }));

  return state;
}

test('IN, OUT and signed adjustment update stock and append snapshots', async (t) => {
  const state = createDbHarness(t);
  const common = { productId: 'product-a', warehouseId: 'warehouse-a', companyId: 'company-a', userId: 'user-a' };

  await movementService.create({ ...common, type: 'in', quantity: 10 });
  assert.equal(state.product.stock, 30);
  await movementService.create({ ...common, type: 'out', quantity: 4 });
  assert.equal(state.product.stock, 26);
  await movementService.create({ ...common, type: 'adjustment', quantity: 4 });
  assert.equal(state.product.stock, 30);
  assert.deepEqual(
    state.movements.map(({ previousStock, newStock }) => [previousStock, newStock]),
    [[20, 30], [30, 26], [26, 30]]
  );
  assert.equal(state.movements[0].companyId, 'company-a');
  assert.equal(state.movements[0].userId, 'user-a');
});

test('insufficient stock, zero adjustment, and failed movement insert do not leave changes', async (t) => {
  const state = createDbHarness(t);
  const common = { productId: 'product-a', warehouseId: 'warehouse-a', companyId: 'company-a' };

  await assert.rejects(
    movementService.create({ ...common, type: 'out', quantity: 21 }),
    (err) => err instanceof ApiError && err.status === 409
  );
  await assert.rejects(
    movementService.create({ ...common, type: 'adjustment', quantity: 0 }),
    (err) => err instanceof ApiError && err.status === 400
  );
  assert.equal(state.product.stock, 20);
  assert.equal(state.movements.length, 0);

  state.failMovementInsert = true;
  await assert.rejects(
    movementService.create({ ...common, type: 'in', quantity: 3 }),
    /movement insert failed/
  );
  assert.equal(state.product.stock, 20);
  assert.equal(state.movements.length, 0);
});

test('movement reversal writes a compensating record and is one-time only', async (t) => {
  const state = createDbHarness(t);
  const original = await movementService.create({
    productId: 'product-a',
    warehouseId: 'warehouse-a',
    companyId: 'company-a',
    userId: 'user-a',
    type: 'in',
    quantity: 10,
  });
  const reversal = await movementService.reverse(original._id, {
    companyId: 'company-a',
    userId: 'user-b',
    reason: 'captured in error',
  });

  assert.equal(state.product.stock, 20);
  assert.equal(reversal.type, 'out');
  assert.equal(reversal.quantity, 10);
  assert.equal(reversal.previousStock, 30);
  assert.equal(reversal.newStock, 20);
  assert.equal(reversal.reversalOf, original._id);
  assert.match(reversal.reference, /captured in error/);
  await assert.rejects(
    movementService.reverse(original._id, { companyId: 'company-a', userId: 'user-b' }),
    (err) => err instanceof ApiError && err.status === 409
  );
  assert.equal(state.product.stock, 20);
});

test('movement creation cannot cross tenant boundary', async (t) => {
  const state = createDbHarness(t);
  await assert.rejects(
    movementService.create({
      productId: 'product-a',
      warehouseId: 'warehouse-a',
      companyId: 'company-b',
      type: 'in',
      quantity: 10,
    }),
    (err) => err instanceof ApiError && err.status === 404
  );
  assert.equal(state.product.stock, 20);
  assert.equal(state.movements.length, 0);
});
