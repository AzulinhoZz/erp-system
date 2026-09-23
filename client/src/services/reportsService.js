import api from './api';

/**
 * Reportes — read-only aggregations (all guarded by reports:read on the
 * server). No generic resource: each endpoint has its own query shape.
 */
const get = async (path, params = {}) => {
  const { data } = await api.get(`/reports${path}`, { params });
  return data;
};

export const reportsService = {
  /** Existencias + lista de stock bajo */
  inventoryStock: () => get('/inventory/stock'),
  /** Facturas emitidas por día/estado */
  salesSummary: ({ from, to } = {}) => get('/sales/summary', { from, to }),
  /** OC recibidas por proveedor */
  purchasesSummary: ({ from, to } = {}) => get('/purchases/summary', { from, to }),
  /** Nómina de un periodo YYYY-MM */
  payrollSummary: (period) => get('/payroll/summary', { period }),
  /** Balance de comprobación (Σdebe − Σhaber por cuenta) */
  trialBalance: ({ from, to } = {}) => get('/finance/trial-balance', { from, to }),
};

export default reportsService;
