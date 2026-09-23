import api from './api';

/**
 * Generic REST helper — every core resource follows the same
 * GET /?page&limit, GET /:id, POST, PUT contract.
 */
function resource(path) {
  return {
    list: async (params = {}) => {
      const { data } = await api.get(`/${path}`, { params });
      return data; // { items, total, page, limit } | [...]
    },
    get: async (id) => {
      const { data } = await api.get(`/${path}/${id}`);
      return data;
    },
    create: async (body) => {
      const { data } = await api.post(`/${path}`, body);
      return data;
    },
    update: async (id, body) => {
      const { data } = await api.put(`/${path}/${id}`, body);
      return data;
    },
  };
}

// Core
export const usersService = resource('users');
export const rolesService = resource('roles');
export const companiesService = resource('companies');
export const branchesService = resource('branches');

// Inventario
export const productsService = resource('products');
export const warehousesService = resource('warehouses');
export const stockMovementsService = resource('stock-movements');

// Compras
export const suppliersService = resource('suppliers');
export const purchaseOrdersService = {
  ...resource('purchase-orders'),
  /** Recibe la OC → transacción: movimientos 'in' + stock */
  receive: async (id, body = {}) => {
    const { data } = await api.post(`/purchase-orders/${id}/receive`, body);
    return data;
  },
};

// Ventas
export const customersService = resource('customers');
export const salesOrdersService = {
  ...resource('sales-orders'),
  /** Confirma la OV → valida crédito y stock, movimientos 'out' */
  confirm: async (id, body = {}) => {
    const { data } = await api.post(`/sales-orders/${id}/confirm`, body);
    return data;
  },
};
export const invoicesService = {
  ...resource('invoices'),
  updateStatus: async (id, status) => {
    const { data } = await api.put(`/invoices/${id}/status`, { status });
    return data;
  },
};

// Finanzas
export const accountsService = resource('accounts');
export const journalEntriesService = resource('journal-entries');

// Notificaciones
export const notificationsService = {
  ...resource('notifications'),
  markRead: async (id) => {
    const { data } = await api.put(`/notifications/${id}/read`);
    return data;
  },
  markAllRead: async () => {
    const { data } = await api.put('/notifications/read-all');
    return data;
  },
};

// RRHH
export const employeesService = resource('employees');
export const attendanceService = resource('attendance');
export const payrollService = {
  ...resource('payroll'),
  /** Procesa un periodo completo (idempotente, transaccional) */
  run: async (body) => {
    const { data } = await api.post('/payroll/run', body);
    return data;
  },
};
