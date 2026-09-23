'use strict';

/**
 * Shared constants, types and validations used by both client and server.
 * Keep this package dependency-free so it can run in any environment.
 */

/** RBAC permission catalog: "resource:action". */
const PERMISSIONS = {
  // core
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  ROLES_READ: 'roles:read',
  ROLES_WRITE: 'roles:write',
  COMPANIES_READ: 'companies:read',
  COMPANIES_WRITE: 'companies:write',
  BRANCHES_READ: 'branches:read',
  BRANCHES_WRITE: 'branches:write',
  // inventario
  PRODUCTS_READ: 'products:read',
  PRODUCTS_WRITE: 'products:write',
  STOCK_READ: 'stock:read',
  STOCK_WRITE: 'stock:write',
  // compras
  SUPPLIERS_READ: 'suppliers:read',
  SUPPLIERS_WRITE: 'suppliers:write',
  PURCHASE_ORDERS_READ: 'purchaseOrders:read',
  PURCHASE_ORDERS_WRITE: 'purchaseOrders:write',
  // ventas
  CUSTOMERS_READ: 'customers:read',
  CUSTOMERS_WRITE: 'customers:write',
  SALES_ORDERS_READ: 'salesOrders:read',
  SALES_ORDERS_WRITE: 'salesOrders:write',
  INVOICES_READ: 'invoices:read',
  INVOICES_WRITE: 'invoices:write',
  // finanzas
  ACCOUNTS_READ: 'accounts:read',
  ACCOUNTS_WRITE: 'accounts:write',
  JOURNAL_ENTRIES_READ: 'journalEntries:read',
  JOURNAL_ENTRIES_WRITE: 'journalEntries:write',
  // rrhh
  EMPLOYEES_READ: 'employees:read',
  EMPLOYEES_WRITE: 'employees:write',
  PAYROLL_READ: 'payroll:read',
  PAYROLL_WRITE: 'payroll:write',
  ATTENDANCE_READ: 'attendance:read',
  ATTENDANCE_WRITE: 'attendance:write',
  // reportes
  REPORTS_READ: 'reports:read',
  // auditoría
  AUDIT_READ: 'audit:read',
  /** Wildcard: grants everything (Super Admin). */
  ALL: '*',
};

/** Default role catalog (seeded on first run). */
const DEFAULT_ROLES = [
  { name: 'Super Admin', permissions: [PERMISSIONS.ALL] },
  {
    name: 'Admin',
    permissions: Object.values(PERMISSIONS).filter((p) => p !== PERMISSIONS.ALL),
  },
  {
    name: 'Contador',
    permissions: [
      PERMISSIONS.ACCOUNTS_READ, PERMISSIONS.ACCOUNTS_WRITE,
      PERMISSIONS.JOURNAL_ENTRIES_READ, PERMISSIONS.JOURNAL_ENTRIES_WRITE,
      PERMISSIONS.REPORTS_READ, PERMISSIONS.INVOICES_READ,
      PERMISSIONS.PURCHASE_ORDERS_READ, PERMISSIONS.SALES_ORDERS_READ,
      PERMISSIONS.COMPANIES_READ, PERMISSIONS.AUDIT_READ,
    ],
  },
  {
    name: 'Almacenista',
    permissions: [
      PERMISSIONS.PRODUCTS_READ, PERMISSIONS.PRODUCTS_WRITE,
      PERMISSIONS.STOCK_READ, PERMISSIONS.STOCK_WRITE,
      PERMISSIONS.SUPPLIERS_READ, PERMISSIONS.PURCHASE_ORDERS_READ,
      PERMISSIONS.BRANCHES_READ,
    ],
  },
  {
    name: 'Vendedor',
    permissions: [
      PERMISSIONS.CUSTOMERS_READ, PERMISSIONS.CUSTOMERS_WRITE,
      PERMISSIONS.SALES_ORDERS_READ, PERMISSIONS.SALES_ORDERS_WRITE,
      PERMISSIONS.INVOICES_READ, PERMISSIONS.PRODUCTS_READ,
    ],
  },
  {
    name: 'Recursos Humanos',
    permissions: [
      PERMISSIONS.EMPLOYEES_READ, PERMISSIONS.EMPLOYEES_WRITE,
      PERMISSIONS.PAYROLL_READ, PERMISSIONS.PAYROLL_WRITE,
      PERMISSIONS.ATTENDANCE_READ, PERMISSIONS.ATTENDANCE_WRITE,
    ],
  },
  {
    name: 'Consulta',
    permissions: [
      PERMISSIONS.USERS_READ, PERMISSIONS.PRODUCTS_READ, PERMISSIONS.STOCK_READ,
      PERMISSIONS.SUPPLIERS_READ, PERMISSIONS.PURCHASE_ORDERS_READ,
      PERMISSIONS.CUSTOMERS_READ, PERMISSIONS.SALES_ORDERS_READ,
      PERMISSIONS.INVOICES_READ, PERMISSIONS.ACCOUNTS_READ,
      PERMISSIONS.JOURNAL_ENTRIES_READ, PERMISSIONS.EMPLOYEES_READ,
      PERMISSIONS.REPORTS_READ, PERMISSIONS.BRANCHES_READ, PERMISSIONS.COMPANIES_READ,
    ],
  },
];

/** Enums used by several modules. */
const STOCK_MOVEMENT_TYPES = ['in', 'out'];
const ORDER_STATUS = ['draft', 'confirmed', 'received', 'invoiced', 'cancelled'];
const INVOICE_STATUS = ['pending', 'paid', 'overdue', 'cancelled'];
const ACCOUNT_TYPES = ['activo', 'pasivo', 'capital', 'ingreso', 'gasto'];

module.exports = { PERMISSIONS, DEFAULT_ROLES, STOCK_MOVEMENT_TYPES, ORDER_STATUS, INVOICE_STATUS, ACCOUNT_TYPES };
