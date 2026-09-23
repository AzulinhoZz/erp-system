# API REST — `/api/v1`

> Formato de error único: `{ "error": { "message": "...", "details": {...} } }`
> Autenticación: `Authorization: Bearer <accessToken>`
> Listados paginados: `{ items, total, page, limit }`

## Core (✅ implementado)

| Método | Endpoint | Permiso | Descripción |
|---|---|---|---|
| POST | `/auth/login` | público | `{email, password}` → `{accessToken, refreshToken, user, company}` |
| POST | `/auth/refresh` | público | `{refreshToken}` → tokens rotados |
| GET | `/auth/me` | autenticado | perfil + rol + permisos |
| GET | `/users` | `users:read` | `?page&limit&q&isActive&companyId` |
| GET | `/users/:id` | `users:read` | |
| POST | `/users` | `users:write` | `{name, email, password, roleId, companyId?}` |
| PUT | `/users/:id` | `users:write` | password opcional |
| GET/POST | `/roles` · GET/PUT `/roles/:id` | `roles:read/write` | |
| GET/POST | `/companies` · GET/PUT `/companies/:id` | `companies:read/write` | |
| GET/POST | `/branches` · GET/PUT `/branches/:id` | `branches:read/write` | |

## Inventario (✅ implementado)

| Método | Endpoint | Permiso |
|---|---|---|
| GET/POST | `/products`, GET/PUT `/products/:id` | `products:read` / `products:write` |
| GET/POST | `/warehouses`, GET/PUT `/warehouses/:id` | `stock:read` / `stock:write` |
| GET/POST | `/stock-movements` | `stock:read` / `stock:write` |

## Compras (✅ implementado)

| Método | Endpoint | Permiso |
|---|---|---|
| GET/POST | `/suppliers`, GET/PUT `/suppliers/:id` | `suppliers:read/write` |
| GET/POST | `/purchase-orders`, GET `/purchase-orders/:id` | `purchaseOrders:read/write` |
| POST | `/purchase-orders/:id/receive` | `purchaseOrders:write` |

## Ventas (✅ implementado)

| Método | Endpoint | Permiso |
|---|---|---|
| GET/POST | `/customers`, GET/PUT `/customers/:id` | `customers:read/write` |
| GET/POST | `/sales-orders`, GET `/sales-orders/:id` | `salesOrders:read/write` |
| POST | `/sales-orders/:id/confirm` | `salesOrders:write` |
| GET/POST | `/invoices` | `invoices:read/write` |
| PUT | `/invoices/:id/status` | `invoices:write` |

## Finanzas (✅ implementado)

| Método | Endpoint | Permiso |
|---|---|---|
| GET/POST | `/accounts`, GET/PUT `/accounts/:id` | `accounts:read/write` |
| GET/POST | `/journal-entries` | `journalEntries:read/write` |

> Las pólizas automáticas se generan internamente (sin endpoint): al facturar
> una OV y al recibir una OC, dentro de la misma transacción.

## RRHH (✅ implementado)

| Método | Endpoint | Permiso |
|---|---|---|
| GET/POST | `/employees`, GET/PUT `/employees/:id` | `employees:read/write` |
| GET | `/payroll` | `payroll:read` |
| POST | `/payroll/run` | `payroll:write` |
| GET/POST | `/attendance`, PUT `/attendance/:id` | `attendance:read/write` |

## Notificaciones y auditoría (✅ implementado)

| Método | Endpoint | Permiso |
|---|---|---|
| GET | `/notifications` | sesión (empresa del JWT) |
| PUT | `/notifications/:id/read`, `/notifications/read-all` | sesión |
| GET | `/audit-logs?entity` | `audit:read` |

> La auditoría no tiene endpoint de escritura: `middlewares/audit.js` registra
> automáticamente cada POST/PUT/PATCH/DELETE exitoso (excluye `/auth`).

## Reportes (✅ implementado)

| Método | Endpoint | Permiso |
|---|---|---|
| GET | `/reports/inventory/stock` | `reports:read` |
| GET | `/reports/sales/summary?from&to` | `reports:read` |
| GET | `/reports/purchases/summary?from&to` | `reports:read` |
| GET | `/reports/payroll/summary?period` | `reports:read` |
| GET | `/reports/finance/trial-balance?from&to` | `reports:read` |

## RRHH (⏳)

| GET/POST | `/employees` | `employees:read/write` |
| POST | `/payroll/run` | `payroll:write` |
| GET/POST | `/attendance` | `attendance:read/write` |

## Reportes (⏳)

| GET | `/reports/:type` | `reports:read` |
