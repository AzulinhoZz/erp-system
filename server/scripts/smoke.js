'use strict';

/**
 * End-to-end smoke test against the running API + real MongoDB Atlas.
 * Covers the integrations that need transactions:
 *   login → branch/warehouse/product → supplier → PO receive (stock in + póliza)
 *   → customer → SO confirm (stock out + credit/stock validation)
 *   → invoice (póliza + status) → low-stock notification → reports → audit
 *
 * Usage: start the server first (`node src/app.js`), then `node scripts/smoke.js`.
 */

require('dotenv').config();

const BASE = `http://localhost:${process.env.PORT || 4000}/api/v1`;
let token = null;
let passed = 0;
// unique per run so the smoke test is re-runnable (sku has a unique index)
const SKU = `P-${Date.now().toString().toUpperCase()}`;
const RUN = Date.now().toString().slice(-6); // suffix for uniquely-indexed names

function ok(label, value) {
  passed += 1;
  console.log(`✓ ${label}${value !== undefined ? ' ' + JSON.stringify(value) : ''}`);
}

async function req(method, path, body, { expect } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (expect) {
    if (res.status !== expect) {
      throw new Error(`${method} ${path} → esperaba ${expect}, llegó ${res.status}: ${JSON.stringify(data)}`);
    }
    return { status: res.status, data };
  }
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

const iso = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

(async () => {
  // 1) Auth -----------------------------------------------------------------
  const auth = await req('POST', '/auth/login', {
    email: 'admin@demo.local',
    password: 'ChangeMe123!',
  });
  token = auth.accessToken;
  ok('login (JWT access + refresh)', { user: auth.user.name, role: auth.user.role.name });
  const companyId = auth.user.companyId;

  // 2) Estructura base -------------------------------------------------------
  const branch = await req('POST', '/branches', { name: `Sucursal Centro ${RUN}`, address: 'Calle 1 #2' });
  ok('branch creada', { id: branch._id, name: branch.name });

  const warehouse = await req('POST', '/warehouses', {
    name: `Bodega Central ${RUN}`,
    branchId: branch._id || branch.id,
    location: 'Planta baja',
  });
  ok('warehouse creada', { id: warehouse._id || warehouse.id });
  const warehouseId = warehouse._id || warehouse.id;

  // Producto con minStock=5 para disparar la alerta stock.low
  const product = await req('POST', '/products', {
    sku: SKU,
    name: 'Producto Demo',
    category: 'demo',
    unit: 'pcs',
    cost: '10.00',
    price: '15.00',
    stock: '0',
    minStock: '5',
  });
  const productId = product._id || product.id;
  ok('producto creado (Decimal128)', {
    sku: product.sku,
    cost: product.cost?.$numberDecimal ?? product.cost,
    stock: product.stock,
  });

  // 3) Compras: PO → receive (transacción: stock in + póliza D Inv / C CxP) --
  const supplier = await req('POST', '/suppliers', { name: `Proveedor Demo ${RUN}`, taxId: `PRO${RUN}` });
  const supplierId = supplier._id || supplier.id;

  const po = await req('POST', '/purchase-orders', {
    supplierId,
    warehouseId,
    items: [{ productId, quantity: 10, unitPrice: '10.00' }],
  });
  const poId = po._id || po.id;
  ok('orden de compra creada (total server-side)', { total: po.total?.$numberDecimal ?? po.total });

  const received = await req('POST', `/purchase-orders/${poId}/receive`, { warehouseId });
  ok('OC recibida (transacción ACID)', { status: received.status });

  const afterPO = await req('GET', `/products/${productId}`);
  if (Number(afterPO.stock) !== 10) throw new Error(`stock esperaba 10, llegó ${afterPO.stock}`);
  ok('stock entró: 10', { stock: afterPO.stock });

  let entries = await req('GET', '/journal-entries');
  const poEntry = (entries.items || []).find((e) => String(e.reference || '').startsWith('PO-'));
  if (!poEntry) throw new Error('No se generó la póliza automática de la OC');
  ok('póliza automática de compras (D Inventarios / C CxP)', { reference: poEntry.reference });

  // 4) Ventas: SO → confirm (crédito + stock out) → invoice (póliza) ---------
  const customer = await req('POST', '/customers', {
    name: `Cliente Demo ${RUN}`,
    taxId: `CLI${RUN}`,
    creditLimit: '1000.00',
  });
  const customerId = customer._id || customer.id;

  const so = await req('POST', '/sales-orders', {
    customerId,
    warehouseId,
    items: [{ productId, quantity: 8, unitPrice: '15.00' }],
  });
  const soId = so._id || so.id;
  ok('orden de venta creada', { total: so.total?.$numberDecimal ?? so.total });

  // Negativa: intentar confirmar más stock del disponible → 409
  const bigSo = await req('POST', '/sales-orders', {
    customerId,
    warehouseId,
    items: [{ productId, quantity: 999, unitPrice: '15.00' }],
  });
  await req('POST', `/sales-orders/${bigSo._id || bigSo.id}/confirm`, { warehouseId }, { expect: 409 });
  ok('venta sin stock suficiente → 409 (rollback)');

  const confirmed = await req('POST', `/sales-orders/${soId}/confirm`, { warehouseId });
  ok('OV confirmada (stock descontado)', { status: confirmed.status });

  const afterSO = await req('GET', `/products/${productId}`);
  if (Number(afterSO.stock) !== 2) throw new Error(`stock esperaba 2, llegó ${afterSO.stock}`);
  ok('stock salió: 10 → 2', { stock: afterSO.stock });

  const invoice = await req('POST', '/invoices', {
    salesOrderId: soId,
    dueDate: iso(30),
  });
  ok('factura creada (OV → invoiced)', {
    amount: invoice.amount?.$numberDecimal ?? invoice.amount,
    status: invoice.status,
  });

  entries = await req('GET', '/journal-entries');
  const invEntry = (entries.items || []).find((e) => String(e.reference || '').startsWith('INV-'));
  if (!invEntry) throw new Error('No se generó la póliza automática de la factura');
  ok('póliza automática de ventas (D CxC / C Ingresos)', { reference: invEntry.reference });
  ok('total de pólizas', { count: entries.total });

  // 5) Notificación de stock bajo (persistida tras el commit) ---------------
  const notifications = await req('GET', '/notifications');
  const lowStock = (notifications.items || []).find((n) => n.type === 'alert' && n.title === 'Stock bajo');
  if (!lowStock) throw new Error('No se persistió la notificación de stock bajo');
  ok('notificación stock bajo persistida', { unread: notifications.unread, message: lowStock.message });

  // 6) Reportes -------------------------------------------------------------
  const inventoryReport = await req('GET', '/reports/inventory/stock');
  const flagged = (inventoryReport.lowStock || []).find((p) => p.sku === SKU);
  if (!flagged) throw new Error('El reporte de existencias no marca el producto como stock bajo');
  if (inventoryReport.totalUnits < 2) {
    throw new Error(`totalUnits esperaba ≥2 (agregación sin cast), llegó ${inventoryReport.totalUnits}`);
  }
  ok('reporte existencias + stock bajo', {
    totalSkus: inventoryReport.totalSkus,
    totalUnits: inventoryReport.totalUnits,
    inventoryValue: inventoryReport.inventoryValue,
  });

  const salesReport = await req('GET', `/reports/sales/summary`);
  if (salesReport.count < 1) throw new Error('El reporte de ventas no vio la factura creada');
  ok('reporte ventas', { count: salesReport.count, total: salesReport.total });

  const balance = await req('GET', '/reports/finance/trial-balance');
  if (!balance.balanced) throw new Error('El balance de comprobación NO cuadra');
  if (balance.lines.length < 2) {
    throw new Error(`el balance no vio las pólizas (cuentas: ${balance.lines.length})`);
  }
  ok('balance de comprobación ✓ cuadra', {
    totalDebit: balance.totalDebit,
    totalCredit: balance.totalCredit,
    cuentas: balance.lines.length,
  });

  // 7) Auditoría automática -------------------------------------------------
  const audit = await req('GET', '/audit-logs?limit=5');
  if (!audit.total) throw new Error('La auditoría automática no registró nada');
  ok('auditoría automática', {
    total: audit.total,
    ultima: audit.items[0] && `${audit.items[0].method} ${audit.items[0].path} → ${audit.items[0].status}`,
  });

  console.log(`\n🎉 SMOKE TEST OK — ${passed} verificaciones superadas`);
  process.exit(0);
})().catch((err) => {
  console.error('\n✗ SMOKE TEST FALLÓ:', err.message);
  process.exit(1);
});
