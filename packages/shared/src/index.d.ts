export declare const PERMISSIONS: Record<string, string> & {
  readonly ALL: '*';
};
export declare const DEFAULT_ROLES: Array<{ name: string; permissions: string[] }>;
export declare const STOCK_MOVEMENT_TYPES: readonly ['in', 'out'];
export declare const ORDER_STATUS: readonly ['draft', 'confirmed', 'received', 'invoiced', 'cancelled'];
export declare const INVOICE_STATUS: readonly ['pending', 'paid', 'overdue', 'cancelled'];
export declare const ACCOUNT_TYPES: readonly ['activo', 'pasivo', 'capital', 'ingreso', 'gasto'];
