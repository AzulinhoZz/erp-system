'use strict';

const express = require('express');
const http = require('http');
const cors = require('cors');

const { env, validateEnv } = require('./config/env');
const { connectDb } = require('./config/db');
const { logger } = require('./middlewares/logger');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');
const { initSockets } = require('./sockets');

// --- Module routers (mount new modules here) ---
const authRoutes = require('./modules/core/auth/routes');
const usersRoutes = require('./modules/core/users/routes');
const rolesRoutes = require('./modules/core/roles/routes');
const companiesRoutes = require('./modules/core/companies/routes');
const branchesRoutes = require('./modules/core/branches/routes');
const productsRoutes = require('./modules/inventario/products/routes');
const warehousesRoutes = require('./modules/inventario/warehouses/routes');
const stockMovementsRoutes = require('./modules/inventario/stockMovements/routes');
const suppliersRoutes = require('./modules/compras/suppliers/routes');
const purchaseOrdersRoutes = require('./modules/compras/purchaseOrders/routes');
const customersRoutes = require('./modules/ventas/customers/routes');
const salesOrdersRoutes = require('./modules/ventas/salesOrders/routes');
const invoicesRoutes = require('./modules/ventas/invoices/routes');
const accountsRoutes = require('./modules/finanzas/accounts/routes');
const journalEntriesRoutes = require('./modules/finanzas/journalEntries/routes');
const attendanceRoutes = require('./modules/rrhh/attendance/routes');
const employeesRoutes = require('./modules/rrhh/employees/routes');
const payrollRoutes = require('./modules/rrhh/payroll/routes');
const notificationsRoutes = require('./modules/notificaciones/notifications/routes');
const auditLogRoutes = require('./modules/notificaciones/auditLog/routes');
const reportsRoutes = require('./modules/reportes/routes');
const { audit } = require('./middlewares/audit');

function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigins, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(logger);
  app.use(audit); // automatic trail on successful mutating requests

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  // Core
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', usersRoutes);
  app.use('/api/v1/roles', rolesRoutes);
  app.use('/api/v1/companies', companiesRoutes);
  app.use('/api/v1/branches', branchesRoutes);

  // Inventario
  app.use('/api/v1/products', productsRoutes);
  app.use('/api/v1/warehouses', warehousesRoutes);
  app.use('/api/v1/stock-movements', stockMovementsRoutes);

  // Compras
  app.use('/api/v1/suppliers', suppliersRoutes);
  app.use('/api/v1/purchase-orders', purchaseOrdersRoutes);

  // Ventas
  app.use('/api/v1/customers', customersRoutes);
  app.use('/api/v1/sales-orders', salesOrdersRoutes);
  app.use('/api/v1/invoices', invoicesRoutes);

  // Finanzas
  app.use('/api/v1/accounts', accountsRoutes);
  app.use('/api/v1/journal-entries', journalEntriesRoutes);

  // RRHH
  app.use('/api/v1/attendance', attendanceRoutes);
  app.use('/api/v1/employees', employeesRoutes);
  app.use('/api/v1/payroll', payrollRoutes);

  // Notificaciones y auditoría
  app.use('/api/v1/notifications', notificationsRoutes);
  app.use('/api/v1/audit-logs', auditLogRoutes);

  // Reportes (agregaciones de todos los módulos)
  app.use('/api/v1/reports', reportsRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

async function start() {
  validateEnv();
  await connectDb();

  const app = createApp();
  const server = http.createServer(app);
  initSockets(server);

  server.listen(env.port, () => {
    console.log(`[api] listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });

  return server;
}

if (require.main === module) {
  start().catch((err) => {
    console.error('[fatal]', err);
    process.exit(1);
  });
}

module.exports = { createApp, start };