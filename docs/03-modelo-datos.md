# Modelo de datos — MongoDB Atlas (Mongoose ODM)

> **Regla obligatoria:** todo campo monetario usa
> `mongoose.Schema.Types.Decimal128`, nunca `Number` (evita errores de
> redondeo en finanzas). Los strings se convierten automáticamente al
> hacer `create`/`save` (Mongoose cast).

## Colecciones

| Colección | Campos | Refs |
|---|---|---|
| `users` | name, email (unique), passwordHash (select:false), isActive | roleId → roles, companyId → companies |
| `roles` | name (unique), permissions[] (`recurso:acción` o `*`) | — |
| `companies` | name, taxId (unique), settings (Mixed) | — |
| `branches` | name, address | companyId → companies |
| `products` | sku (unique), name, category, unit, cost (Decimal128), price (Decimal128), stock | — |
| `warehouses` | name, location | branchId → branches |
| `stockMovements` | type (in/out), quantity, date, reference | productId → products, warehouseId → warehouses |
| `suppliers` | name, taxId, contact | — |
| `purchaseOrders` | items[], status, total (Decimal128), date | supplierId → suppliers |
| `customers` | name, taxId, contact, creditLimit (Decimal128) | — |
| `salesOrders` | items[], status, total (Decimal128), date | customerId → customers |
| `invoices` | amount (Decimal128), dueDate, status | salesOrderId → salesOrders |
| `accounts` | code (unique), name, type (activo/pasivo/capital/ingreso/gasto) | — |
| `journalEntries` | date, lines[{debit (Decimal128), credit (Decimal128)}], reference | lines.accountId → accounts |
| `employees` | name, position, salary (Decimal128) | branchId → branches |
| `payroll` | period, grossPay (Decimal128), deductions (Decimal128), netPay (Decimal128) | employeeId → employees |
| `attendance` | date, checkIn, checkOut | employeeId → employees |
| `auditLogs` | action, entity, entityId, timestamp | userId → users |
| `notifications` | message, read, type, date | userId → users |

## Índices recomendados
- `users`: `{companyId: 1, isActive: 1}` (+ unique en email)
- `branches`: `{companyId: 1, name: 1}` unique
- `stockMovements`: `{productId: 1, warehouseId: 1, date: -1}`
- `journalEntries`: `{date: -1}`

## Transacciones ACID
Operaciones que tocan **dinero o dos colecciones** deben usar:
```js
const session = await mongoose.startSession();
session.startTransaction();
try {
  // ... writes con { session }
  await session.commitTransaction();
} catch (e) {
  await session.abortTransaction();
  throw e;
} finally {
  session.endSession();
}
```
Ejemplo: registrar venta → `salesOrders` + `stockMovements` + `products.stock`
+ `journalEntries` (póliza contable) en una sola transacción.

## Serialización de Decimal128 en la API
JSON de Mongoose: `{ "$numberDecimal": "1234.56" }`.
El cliente usa `client/src/utils/money.js` (`decimalToNumber`, `formatMoney`)
solo para mostrar; para enviar, strings con 2 decimales (`toDecimalString`).
