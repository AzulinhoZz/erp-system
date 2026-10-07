'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const mongoose = require('mongoose');
const { createApp } = require('../src/app');

test('health endpoint reports database readiness instead of a false healthy status', async (t) => {
  const server = createApp().listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}/health`;

  const originalDescriptor = Object.getOwnPropertyDescriptor(mongoose.connection, 'readyState');
  t.after(() => {
    if (originalDescriptor) Object.defineProperty(mongoose.connection, 'readyState', originalDescriptor);
    else delete mongoose.connection.readyState;
  });

  Object.defineProperty(mongoose.connection, 'readyState', { configurable: true, value: 0 });
  const unavailable = await fetch(url);
  assert.equal(unavailable.status, 503);
  assert.deepEqual(await unavailable.json(), { status: 'unavailable', database: 'disconnected' });

  Object.defineProperty(mongoose.connection, 'readyState', { configurable: true, value: 1 });
  const available = await fetch(url);
  assert.equal(available.status, 200);
  assert.deepEqual(await available.json(), { status: 'ok', database: 'connected' });
});
