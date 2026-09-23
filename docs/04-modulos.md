# Módulos y roles

## Módulos

| Módulo | Entidades | Estado |
|---|---|---|
| Core/Configuración | Company, Branch, User, Role | ✅ |
| Inventario y Almacén | Product, Warehouse, StockMovement | ✅ |
| Compras | Supplier, PurchaseOrder | ✅ |
| Ventas/CRM | Customer, SalesOrder, Invoice | ✅ |
| Finanzas y Contabilidad | Account, JournalEntry | ✅ |
| Recursos Humanos | Employee, Payroll, Attendance | ✅ |
| Notificaciones y Auditoría | Notification, AuditLog | ✅ |
| Reportes | (vistas de agregación, sin colección propia) | ✅ |
| Recursos Humanos | Employee, Payroll, Attendance | ⏳ |
| Reportes/BI | Report, Dashboard | ⏳ |
| Notificaciones/Auditoría | Notification, AuditLog | ⏳ (al final, en `modules/notificaciones/`) |

**Orden de construcción (sección 9 del prompt):**
core → inventario → compras + ventas → finanzas → rrhh → reportes/notificaciones.
Cada fase backend va seguida de sus pantallas en `client/src/screens/<módulo>`.

## Roles RBAC (seed en `server/scripts/seed.js`)

| Rol | Permisos |
|---|---|
| Super Admin | `*` (todas las empresas) |
| Admin | todos los permisos del catálogo (en su empresa, por `companyId`) |
| Contador | accounts\*, journalEntries\*, reports:read, invoices:read, purchaseOrders:read, salesOrders:read, companies:read, audit:read |
| Almacenista | products\*, stock\*, suppliers:read, purchaseOrders:read, branches:read |
| Vendedor | customers\*, salesOrders\*, invoices:read, products:read |
| Recursos Humanos | employees\*, payroll\*, attendance\* |
| Consulta | solo `*:read` en todas las áreas |

La validación ocurre en `middlewares/rbac.js` contra `roles.permissions[]`
en la base de datos (con caché de 60 s). El frontend solo oculta botones
con `usePermission()` — **la autoridad real es el backend**.

## Notificaciones en tiempo real ( Socket.io )
- Autenticación por JWT en el handshake.
- Rooms: `user:<id>` y `company:<companyId>`.
- Evento estándar: `notification` (payload = doc de `notifications`).
- Eventos de negocio: `stock.low`, etc. (ej. stock bajo → alerta a compras).
