# ERP Azul — Sistema ERP modular (Proyecto de estadía, UPTx)

ERP genérico y componible: cada empresa activa solo los módulos que necesita.
Un mismo código fuente (React Native + React Native Web) sirve la app móvil
(Android/iOS) y el panel web.

## Stack
- **Frontend:** React Native + React Native Web (Expo), Zustand, Axios, React Navigation
- **Backend:** Node.js + Express, API REST versionada `/api/v1`
- **BD:** MongoDB Atlas + Mongoose (dinero = `Decimal128`, transacciones ACID)
- **Tiempo real:** Socket.io
- **Auth:** JWT (access 15 min + refresh 7 días rotado) + RBAC por permisos en BD
- **Nativo:** Kotlin solo como puente de hardware (`client/android/.../nativemodules/`)

## Estructura
```
erp-system/
├── client/        # Expo: pantallas, navegación, store, services (RN + RNW)
├── server/        # Express: modules/<módulo>/{routes,controller,service,model,validators}
├── packages/shared/  # Permisos, roles por defecto, enums compartidos
└── docs/          # Arquitectura, API, modelo de datos, bitácora por fase
```

## Puesta en marcha
```bash
npm install

# 1. Configurar el backend
cp server/.env.example server/.env   # llenar MONGO_URI y secretos
npm run seed --workspace=server      # roles + empresa demo + admin@demo.local

# 2. Backend
npm run dev:server

# 3. Cliente (móvil/web)
cp client/.env.example client/.env
npm run dev --workspace=client       # Expo Go (Android/iOS)
npm run dev:web --workspace=client   # panel web
```

## Documentación
- `docs/01-arquitectura.md` — capas y reglas transversales
- `docs/02-api.md` — catálogo de endpoints por módulo
- `docs/03-modelo-datos.md` — colecciones, Decimal128, transacciones
- `docs/04-modulos.md` — módulos, roles RBAC, tiempo real
- `docs/bitacora-de-modulos.md` — avance por fase (entregables)
