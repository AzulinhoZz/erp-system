# Bitácora de módulos

Cada fase registra: archivos creados, endpoints, modelo de datos y
decisiones de diseño validadas por el/la estudiante.

---

## Fase 1 — Monorepo + Módulo Core ✅

**Fecha:** septiembre 2026

### Archivos creados (resumen)

**Monorepo**
- `package.json` raíz con npm workspaces: `client/`, `server/`, `packages/shared`
- `.gitignore`, `docs/README.md`

**Infraestructura del backend (`server/src/`)**
- `app.js` — Express, CORS, logger, montaje de rutas, error handler, arranque + Socket.io
- `config/env.js` — única lectura de `process.env` con validación fail-fast
- `config/db.js` — conexión Mongoose → MongoDB Atlas
- `middlewares/auth.js` — verificación JWT Bearer
- `middlewares/rbac.js` — `authorize('recurso:acción')` contra `roles.permissions[]` en BD (caché 60 s)
- `middlewares/errorHandler.js` — `ApiError` + forma JSON única de errores
- `middlewares/logger.js` — log de requests con redacción de secretos
- `middlewares/validate.js` — ejecuta cadenas de express-validator
- `sockets/index.js` — Socket.io autenticado, rooms `user:<id>` y `company:<id>`
- `.env.example`, `scripts/seed.js`

**Módulo core (`server/src/modules/core/`)** — patrón `routes → controller → service → model → validators` por entidad:
- `auth/` (service, controller, routes, validators)
- `users/`, `roles/`, `companies/`, `branches/` (model, service, controller, routes, validators)

**Compartido (`packages/shared/src/`)** — `PERMISSIONS`, `DEFAULT_ROLES` (7 roles), enums de negocio.

**Cliente (`client/`)** — Expo + React Native + React Native Web
- `app.json`, `index.js`, `App.js`
- `src/store/authStore.js` — Zustand + persistencia AsyncStorage
- `src/services/api.js` — axios + interceptor de refresh silencioso en 401
- `src/services/authService.js`, `src/services/resources.js` — helpers REST
- `src/components/ui.js` — primitivas de UI (Screen, Card, AppButton, AppInput, Field…)
- `src/components/CrudScreen.js` — pantalla CRUD config-driven reutilizada por todos los módulos
- `src/navigation/index.js` — switch Login/Main + tabs filtrados por permisos
- `src/screens/core/` — `LoginScreen`, `UsersScreen`, `RolesScreen`, `CompaniesScreen`, `BranchesScreen`
- `src/hooks/usePermission.js`, `src/utils/money.js` (Decimal128 → display)
- `web/README.md`, `.env.example`

### Endpoints
| Método | Endpoint | Permiso |
|---|---|---|
| POST | `/api/v1/auth/login` | público |
| POST | `/api/v1/auth/refresh` | público |
| GET | `/api/v1/auth/me` | autenticado |
| GET/POST | `/api/v1/users`, GET/PUT `/api/v1/users/:id` | `users:read` / `users:write` |
| GET/POST | `/api/v1/roles`, GET/PUT `/api/v1/roles/:id` | `roles:read` / `roles:write` |
| GET/POST | `/api/v1/companies`, GET/PUT `/api/v1/companies/:id` | `companies:read` / `companies:write` |
| GET/POST | `/api/v1/branches`, GET/PUT `/api/v1/branches/:id` | `branches:read` / `branches:write` |

### Modelo de datos
`users, roles, companies, branches` — exactamente sección 6 del prompt.
`passwordHash` con `select: false` y transform `toJSON` que lo elimina.

### Decisiones validadas
1. Subcarpeta por entidad dentro de cada módulo (patrón `routes→controller→service→model→validators`).
2. Roles globales; alcance por empresa = `companyId` del JWT (multi-tenant).
3. Permisos `recurso:acción` + wildcard `*` (Super Admin).
4. Refresh JWT stateless rotado (access 15 min / refresh 7 días), sin colección de tokens.
5. Seed de los 7 roles de la sección 8 + empresa demo + Super Admin (`npm run seed --workspace=server`).
6. Notificaciones/auditoría van en `server/src/modules/notificaciones/` (módulo nuevo aprobado, fase final).
7. Librerías aprobadas: express, mongoose, jsonwebtoken, bcryptjs, cors, dotenv, express-validator, socket.io, expo, axios, zustand, react-navigation, async-storage.

---

## Fase 2 — Inventario ✅

**Fecha:** septiembre 2026

### Archivos creados
**Backend (`server/src/modules/inventario/`)**
- `products/` — model, service, controller, routes, validators
- `warehouses/` — model, service, controller, routes, validators
- `stockMovements/` — model, service, controller, routes, validators
- `middlewares/validate.js` → helper `isDecimalString` (dinero viaja como string)
- `app.js` → montaje de las 3 rutas nuevas

**Frontend (`client/src/`)**
- `screens/inventario/ProductsScreen.js` — costo/precio con `formatMoney`, alerta visual de stock bajo
- `screens/inventario/WarehousesScreen.js` — select de sucursal
- `screens/inventario/StockMovementsScreen.js` — alta de entradas/salidas con selects
- `services/resources.js` → `productsService`, `warehousesService`, `stockMovementsService`
- `navigation/index.js` → 3 tabs nuevos filtrados por permiso

### Endpoints
| Método | Endpoint | Permiso |
|---|---|---|
| GET/POST | `/api/v1/products` | `products:read` / `products:write` |
| GET/PUT | `/api/v1/products/:id` | idem |
| GET/POST | `/api/v1/warehouses` | `stock:read` / `stock:write` |
| GET/PUT | `/api/v1/warehouses/:id` | idem |
| GET/POST | `/api/v1/stock-movements` | `stock:read` / `stock:write` |

### Modelo de datos
`products, warehouses, stockMovements` — sección 6 del prompt.
`cost`/`price` = Decimal128 (recibidos como string `"1234.56"`), `stock` = Number
(cantidad, no dinero), `stockMovements` append-only.

### Decisiones tomadas (validar)
1. **`products` añade `companyId`** (multi-tenancy, como users/branches) y
   **`minStock`** (umbral para la alerta stock bajo → compras). Campos extra a la sección 6.
2. **`stock` no es editable por `PUT /products`** — solo cambia vía
   `POST /stock-movements` para que el libro de movimientos siempre cuadre.
3. **Transacción ACID** en `stockMovements.create`: inserta movimiento +
   `$inc` en `products.stock` con `session.withTransaction()`; el evento
   `stock.low` (Socket.io) se emite **después del commit**, jamás dentro
   de la transacción, y nunca rompe el flujo de negocio si falla.
4. **Endpoints extra al patrón:** `GET /stock-movements` y `GET /warehouses/:id`
   (necesarios para las pantallas).
5. **Fix de monorepo:** `overrides: {"react-native": "0.86.3"}` en el
   package.json raíz — npm había auto-instalado una copia 0.87.1 incompatible
   con Expo SDK 57 en la raíz (duplicaba React Native y rompía el bundle web).

### Verificación
- Servidor: app carga con **30 rutas** (core + inventario).
- Cliente: `expo export --platform web` compila sin errores (bundle 881 KB).

---

## Fase 3 — Compras + Ventas ✅

**Fecha:** septiembre 2026

### Archivos creados
**Backend**
- `server/src/modules/compras/{suppliers,purchaseOrders}/` — patrón completo (5 archivos c/u)
- `server/src/modules/ventas/{customers,salesOrders,invoices}/` — patrón completo (5 archivos c/u)
- `app.js` → montaje de las 5 rutas

**Frontend**
- `components/OrderEditor.js` — editor de renglones compartido por OC/OV
  (proveedor/cliente + bodega + productos con precio sugerido + total en vivo)
- `components/ModuleMenu.js` — menú por módulo filtrado por permisos
- `components/CrudScreen.js` → +`rowActions` (botones por fila), `onCreate`, `onBack`
- `components/ui.js` → `Screen` con botón "‹ Atrás"
- `screens/compras/{SuppliersScreen,PurchaseOrdersScreen}.js`
- `screens/ventas/{CustomersScreen,SalesOrdersScreen,InvoicesScreen}.js`
- `navigation/index.js` → **reestructurado**: 5 tabs (Config, Inventario,
  Compras, Ventas, Sesión); cada módulo es un stack menú → pantallas
  (escalable para finanzas/rrhh/reportes)

### Endpoints
| Método | Endpoint | Permiso |
|---|---|---|
| GET/POST | `/api/v1/suppliers` · GET/PUT `/:id` | `suppliers:read/write` |
| GET/POST | `/api/v1/purchase-orders` · GET `/:id` | `purchaseOrders:read/write` |
| POST | `/api/v1/purchase-orders/:id/receive` | `purchaseOrders:write` |
| GET/POST | `/api/v1/customers` · GET/PUT `/:id` | `customers:read/write` |
| GET/POST | `/api/v1/sales-orders` · GET `/:id` | `salesOrders:read/write` |
| POST | `/api/v1/sales-orders/:id/confirm` | `salesOrders:write` |
| GET/POST | `/api/v1/invoices` · PUT `/:id/status` | `invoices:read/write` |

### Modelo de datos
`suppliers, purchaseOrders, customers, salesOrders, invoices` — sección 6.
`total`, `creditLimit`, `amount`, `unitPrice` en Decimal128 (viajan como string).

### Decisiones tomadas (validar)
1. **`items[]` de las órdenes**: `{productId, quantity, unitPrice (Decimal128)}` —
   la sección 6 solo decía `items[]` sin definir renglones.
2. **`total` siempre calculado en el servidor** desde los items (nunca se
   acepta del cliente) → `quantity × unitPrice` con 2 decimales.
3. **Endpoint `POST /:id/receive` (OC)**: transacción ACID que inserta
   `stockMovements(type 'in')` + `$inc stock` + estado `received`.
4. **Endpoint `POST /:id/confirm` (OV)**: transacción ACID que valida
   **línea de crédito** (facturas pendientes + órdenes confirmadas + esta
   orden ≤ `creditLimit`, 0 = sin límite) y **stock por renglón**; si algún
   renglón falla → rollback total; inserta movimientos `out` y `$inc -stock`;
   tras el commit emite `stock.low` si cruza el mínimo.
5. **`POST /invoices`**: exige OV en estado `confirmed`; una factura por OV
   (índice unique); la transacción crea la factura y pasa la OV a `invoiced`.
6. **Campos extra**: `purchaseOrders/salesOrders` añaden `warehouseId`
   (bodega destino/origen) y `companyId`; `suppliers/customers` añaden `companyId`.
7. **Estados reutilizan** `ORDER_STATUS`/`INVOICE_STATUS` de `@erp/shared`.

### Verificación
- Servidor: **49 rutas** cargan sin errores.
- Cliente: `expo export --platform web` compila (incluye OrderEditor y navegación por módulos).

---

## Fase 4 — Finanzas ✅

**Fecha:** septiembre 2026

### Archivos creados
- `server/src/modules/finanzas/{accounts,journalEntries}/` — patrón completo (5 archivos c/u)
- `app.js` → +2 routers
- `server/scripts/seed.js` → +catálogo base de **10 cuentas por empresa**
  (1000 Activo, 1010 Bancos, 1050 Inventarios, 1100 CxC, 2000 Pasivo,
  2100 CxP, 3000 Capital, 4000 Ingresos, 5000 Costo de ventas, 6000 Gastos)
  + `company.settings.defaultAccounts = {inventory:'1050',
  accountsReceivable:'1100', accountsPayable:'2100', salesRevenue:'4000'}`
- **Integraciones en services existentes** (misma transacción):
  - `ventas/invoices/service.create` → póliza automática
    (D Cuentas por cobrar / C Ingresos)
  - `compras/purchaseOrders/service.receive` → póliza automática
    (D Inventarios / C Cuentas por pagar)
- Cliente:
  - `screens/finanzas/AccountsScreen.js` — chips por tipo de cuenta
  - `screens/finanzas/JournalEntriesScreen.js` — editor de partidas con
    indicador "✓ Cuadra / ✗ No cuadra" (el servidor también valida)
  - `services/resources.js` → +`accountsService`, `journalEntriesService`
  - `navigation/index.js` → +tab/pila **Finanzas**

### Endpoints
| Método | Endpoint | Permiso |
|---|---|---|
| GET/POST | `/api/v1/accounts` · GET/PUT `/:id` | `accounts:read/write` |
| GET/POST | `/api/v1/journal-entries` | `journalEntries:read/write` |

### Modelo de datos
`accounts` (code, name, type, +companyId, unique por empresa) y
`journalEntries` (date, lines[{accountId, debit, credit}] Decimal128,
reference, +companyId) — sección 6 + multi-tenancy.

### Decisiones tomadas (validar)
1. **Partida doble validada en el servidor**: ≥2 líneas, Σdébitos = Σcréditos
   (tolerancia 0.005), ninguna línea con ambos importes ni en cero, y todas
   las cuentas deben pertenecer a la empresa.
2. **`postAutomaticEntry`** (helper en journalEntries/service): resuelve
   códigos desde `company.settings.defaultAccounts`; si no están configurados
   **omite con `console.warn`** (nunca rompe el flujo de facturación/recepción).
   Se ejecuta DENTRO de la transacción de invoices/receive.
3. **Cuentas por empresa** con `code` único por compañía (índice compuesto);
   el seed crea 10 cuentas base con códigos estilo mexicano.
4. **Líneas de pólizas inmutables** tras crearse (no hay PUT
   `/journal-entries/:id`; corrección solo con una póliza de reversión —
   práctica contable estándar).
5. `accounts.type` queda en **español** (`activo/pasivo/capital/ingreso/gasto`)
   porque es el valor de la sección 6; el resto del código en inglés.

### Verificación
- Servidor: **55 rutas** cargan sin errores.
- Cliente: `expo export --platform web` compila.

---

## Fase 5 — RRHH ✅

**Fecha:** septiembre 2026

### Archivos creados
**Backend** — `server/src/modules/rrhh/{employees,payroll,attendance}/`
patrón completo (model, service, controller, routes, validators ×3).
`app.js` → +3 routers montados.

**Frontend**
- `screens/rrhh/EmployeesScreen.js` — select de sucursal, salario Decimal128
- `screens/rrhh/PayrollScreen.js` — botón **"Correr nómina"** (modal con
  periodo YYYY-MM), resultados por periodo y **totales agregados** por periodo
- `screens/rrhh/AttendanceScreen.js` — marcas entrada/salida por empleado/día
- `services/resources.js` → +`employeesService`, `payrollService.run()`,
  `attendanceService`
- `navigation/index.js` → +tab/pila **RRHH**

### Endpoints
| Método | Endpoint | Permiso |
|---|---|---|
| GET/POST | `/api/v1/employees` · GET/PUT `/:id` | `employees:read/write` |
| GET | `/api/v1/payroll` | `payroll:read` |
| POST | `/api/v1/payroll/run` | `payroll:write` |
| GET/POST | `/api/v1/attendance` · PUT `/:id` | `attendance:read/write` |

### Modelo de datos
`employees` (name, position, branchId, salary Decimal128, +isActive, +companyId),
`payroll` (employeeId, period `YYYY-MM`, grossPay/deductions/netPay Decimal128,
+companyId, **unique (employeeId, period)**),
`attendance` (employeeId, date, checkIn/checkOut `HH:MM`, +companyId,
**unique (employeeId, date)**).

### Decisiones tomadas (validar)
1. **`POST /payroll/run`** procesa el periodo completo **en una transacción**:
   `grossPay = salary`, `deductions = gross × settings.payroll.deductionRate`
   (default **0**, configurable por empresa), `netPay = gross − deductions`.
   **Idempotente**: los empleados que ya tienen nómina en el periodo se omiten
   (índice unique); devuelve `{created, skipped}`.
2. **`checkIn/checkOut` como strings `HH:MM`** (marcas de turno, no timestamps).
3. **Attendance upsert por día**: re-postear el mismo día **actualiza** las
   marcas en vez de fallar por el índice unique.
4. **`employees.companyId` denormalizado desde la sucursal** al crear/editar
   para que el scoping por empresa siempre sea consistente.
5. **`isActive` en employees**: bajas lógicas; la nómina solo procesa activos
   pero el histórico se conserva.

### Verificación
- Servidor: **64 rutas** cargan sin errores.
- Cliente: `expo export --platform web` compila.

---

## Fase 6 — Reportes + Notificaciones/Auditoría ✅ (FASE FINAL)

**Fecha:** septiembre 2026

### Archivos creados
**Backend**
- `server/src/modules/notificaciones/notifications/` — model, service,
  controller, routes, validators (persiste `type, title, message, read, date,
  companyId`; endpoints GET + PUT `/:id/read` + PUT `/read-all`)
- `server/src/modules/notificaciones/auditLog/` — model, service, controller,
  routes, validators (GET `/audit-logs`, permiso `audit:read`, **solo lectura**)
- `server/src/middlewares/audit.js` — **middleware automático** (decidido):
  registra toda petición POST/PUT/PATCH/DELETE **exitosa** (status < 400),
  omite `/auth`, redacta campos tipo password/token y guarda user, método,
  ruta, entidad, status, IP y resumen del body (≤2000 chars). Fire-and-forget.
- `server/src/modules/reportes/{service,controller,routes,validators}.js` —
  **sin model** (solo agregaciones, sin colecciones nuevas)
- **Integración de persistencia** en los 2 puntos de emisión `stock.low`
  (`inventario/stockMovements/service` y `ventas/salesOrders/service`):
  ahora además de emitir por socket, guardan la notificación.

**Frontend**
- `services/sockets.js` — cliente Socket.io con token de auth + `onEvent()`
- `services/reportsService.js` — los 5 reportes
- `services/resources.js` → +`notificationsService` (markRead/markAllRead)
- `screens/notificaciones/NotificationsScreen.js` — lista persistida +
  **eventos en vivo** (`stock.low` se prepende con sello "● en vivo"),
  contador de no leídas, marcar una o todas
- `screens/reportes/ReportsScreen.js` — chips de los 5 reportes con filtros
  de fecha/periodo, KPIs y tablas; valida `reports:read` en UI
- `navigation/index.js` → +tab **Reportes**; la pila **Sesión** ahora contiene
  *Mi perfil* y *Notificaciones*; `disconnectSocket()` al cerrar sesión

**Instalación aprobada:** `socket.io-client@4.8.3` (workspace client).

### Endpoints
| Método | Endpoint | Permiso |
|---|---|---|
| GET | `/api/v1/notifications` | sesión (cada quien lo suyo) |
| PUT | `/api/v1/notifications/:id/read` · `/read-all` | sesión |
| GET | `/api/v1/audit-logs` | `audit:read` |
| GET | `/api/v1/reports/inventory/stock` | `reports:read` |
| GET | `/api/v1/reports/sales/summary?from&to` | `reports:read` |
| GET | `/api/v1/reports/purchases/summary?from&to` | `reports:read` |
| GET | `/api/v1/reports/payroll/summary?period` | `reports:read` |
| GET | `/api/v1/reports/finance/trial-balance?from&to` | `reports:read` |

### Decisiones tomadas
1. **Auditoría por middleware** (exitosas nada más; `/auth` fuera; secrets
   redactados) — cero cambios en los services ya validados.
2. **Notificaciones sin permiso RBAC propio**: cada usuario ve/lista las de su
   empresa; el alta la hacen los services de negocio.
3. **Reportes sin modelo**: las 5 vistas son agregaciones (no crean colecciones);
   `reportes` no tiene `model.js` — el patrón routes→controller→service se
   mantiene.
4. **Doble canal de stock.low**: se persiste (para el histórico y reconexiones)
   Y se emite en vivo (para la pantalla abierta).
5. Decimal128 se convierte con `toString()` antes de sumar/enviar en los
   agregados.

### Verificación final
- Servidor: **73 rutas** cargan sin errores.
- Cliente: `expo export --platform web` compila con el grafo completo.

---

## Prueba end-to-end contra MongoDB Atlas ✅

**Fecha:** 22 de septiembre de 2026

### Ejecución
1. `node scripts/seed.js` → 7 roles + Empresa Demo + Super Admin +
   10 cuentas contables + `settings.defaultAccounts` en **Atlas real**.
2. `node src/app.js` + `node scripts/smoke.js` → **20/20 verificaciones**:

```
login (JWT access + refresh)                    branch/warehouse/producto (Decimal128)
OC creada (total server-side = 100.00)          OC recibida (transacción ACID)
stock entró: 10                                póliza D Inventarios / C CxP (PO-…)
OV creada (total = 120.00)                       venta sin stock → 409 (rollback total)
OV confirmada (stock salió 10 → 2)               factura creada (amount 120.00, OV → invoiced)
póliza D CxC / C Ingresos (INV-…)                notificación "stock bajo" persistida (unread)
reporte existencias: 3 SKUs, 6 unidades, valor 60
reporte ventas: 3 facturas, total 360
balance de comprobación ✓ cuadra: 660 = 660 (4 cuentas)
auditoría automática: 33 registros (último: POST /invoices → 201)
```

### Bugs encontrados y corregidos por la prueba
1. **JWT con `companyId` poblado** (`auth/service.js`): `login` hace
   `populate('companyId')`, y `doc.toString()` producía un string multicapa →
   `Cast to ObjectId failed` en el primer POST. Corregido con
   `String(companyId._id || companyId)` en `signTokens` y `buildProfile`.
   *Nota: cierra y vuelve a entrar a la sesión para que el JWT viejo se renueve.*
2. **Agregaciones sin cast** (`reportes/service.js`): `$match` de agregación
   NO convierte strings a ObjectId (a diferencia de `find`/`countDocuments`):
   los reportes devolvían 0. Corregido con helper `oid()` en los 5 reportes.
3. **Valor de inventario** sumaba costos unitarios; corregido a
   `Σ(stock × costo)`.

### Artefactos
- `server/scripts/smoke.js` — prueba re-ejecutable (SKU y nombres únicos por
  corrida); cubre login, CRUDE estructural, transacciones de OC/OV/factura,
  rollback por stock insuficiente, notificaciones, los 3 reportes con datos y
  la auditoría.

---

---
