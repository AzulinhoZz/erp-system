# Arquitectura por capas — ERP Azul

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Presentación    React Native + React Native Web (Expo)   │
│    client/src/{screens,components,navigation,store}         │
├─────────────────────────────────────────────────────────────┤
│ 2. Puentes nativos Kotlin (solo hardware: QR, impresión,    │
│    biometría, push) — client/android/.../nativemodules/     │
│    SIN lógica de negocio                                    │
├─────────────────────────────────────────────────────────────┤
│ 3. API / Gateway   Express /api/v1 + JWT + RBAC             │
│    routes → controller → service (middlewares: auth, rbac)  │
├─────────────────────────────────────────────────────────────┤
│ 4. Lógica de negocio  services por módulo (transacciones    │
│    ACID multi-documento al tocar dinero/stock)              │
├─────────────────────────────────────────────────────────────┤
│ 5. Tiempo real     Socket.io (rooms por usuario y empresa)  │
├─────────────────────────────────────────────────────────────┤
│ 6. Persistencia    MongoDB Atlas + Mongoose (Decimal128     │
│    en todo campo monetario)                                 │
└─────────────────────────────────────────────────────────────┘
```

## Reglas transversales
- **Dinero:** siempre `mongoose.Schema.Types.Decimal128`, nunca `Number`.
- **RBAC:** permisos en `roles.permissions[]` (BD), validados por `authorize()`.
- **Multi-tenant:** `companyId` en el JWT; los services filtran por empresa.
- **Transacciones:** `session.startTransaction()` en operaciones que toquen
  dos colecciones relacionadas con dinero o stock (ej. venta → stock + póliza).
- **Idioma:** código en inglés, documentación/UI en español.
- **Kotlin:** solo puentes puntuales, empaquetado en `nativemodules/`.

## Patrón de módulo (backend)
```
server/src/modules/<modulo>/<entidad>/
  routes.js      → validadores + authorize() + controller
  controller.js  → solo HTTP (req/res/next), sin lógica de negocio
  service.js     → lógica de negocio + transacciones
  model.js       → schema Mongoose
  validators.js  → cadenas express-validator
```

## Patrón de módulo (frontend)
```
client/src/screens/<modulo>/XScreen.js   → pantallas
client/src/services/resources.js         → helpers REST genéricos
client/src/components/CrudScreen.js      → CRUD reutilizable config-driven
client/src/store/authStore.js            → sesión + RBAC de UI (Zustand)
```
## Core 2.0 — hardening multi-tenant y RBAC

- El contexto de empresa para operaciones de usuarios proviene exclusivamente de req.user.companyId, derivado del JWT autenticado.
- Los parámetros companyId enviados por el cliente no seleccionan el tenant.
- Las lecturas y actualizaciones de usuarios se resuelven con {_id, companyId} para evitar acceso cruzado por ID.
- server/src/middlewares/tenantScope.js centraliza la exigencia de contexto de empresa.
- Los roles siguen siendo globales en esta fase; un Admin de empresa no puede asignar ni crear un rol con *, Super Admin o marca de plataforma.
- No se introduce stock por almacén ni nuevos módulos.
- El frontend conserva los contratos existentes; el endurecimiento se realiza en backend.
