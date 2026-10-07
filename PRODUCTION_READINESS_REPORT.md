# SYS ERP — Production Readiness Report

## Estado general

Production readiness: 72%

La base de código pasó pruebas aisladas y exports Expo; todavía no es correcto declarar el ERP probado para producción. El CRUD real contra MongoDB, la transacción en replica set, el despliegue de estos cambios y una instalación iOS firmada siguen pendientes.

## Implementado y corregido

- `/health` en el código actual devuelve HTTP 200 si Mongoose está conectado y 503 si no lo está.
- Contexto de empresa desde JWT, protección de RBAC para permisos de plataforma y endpoint de cambio de empresa restringido al rol `*`.
- Productos: allowlist de campos, SKU duplicado como conflicto, stock inicial únicamente por movimiento y desactivación lógica.
- Usuarios: allowlist de campos, hashing bcrypt, respuesta JSON sin `passwordHash`, permisos de plataforma no asignables por administradores de empresa y desactivación lógica sin auto-bloqueo.
- Inventario: IN, OUT y ajuste delta con stock no negativo; movimiento y actualización de producto dentro de transacción.
- Movimientos: snapshots de existencia anterior/nueva, empresa, usuario y fecha; reversión compensatoria enlazada al movimiento original.
- Entradas de compras y salidas de ventas mantienen los snapshots y el actor en sus movimientos.
- Auditoría de mutaciones con redacción de credenciales y sin registrar flujos de autenticación.
- Tokens nativos guardados en SecureStore; AsyncStorage se conserva para web.
- `client/eas.json` incluye perfiles iOS; producción inyecta HTTPS de Render.
- Nombre Expo `SYS ERP`, scheme `sys-erp` y bundle identifier existente `mx.uptx.erp` preservado.

## Tests y builds

```text
npm test --workspace=server
Passed: 29
Failed: 0
Skipped: 0
```

También pasaron:

- `npm run build:web --workspace=client`
- `npx expo export --platform ios`
- `node --check` para módulos de servidor modificados
- Parseo JSON de `client/app.json` y `client/eas.json`
- `git diff --check`

Estos tests sustituyen MongoDB por stubs aislados; no son evidencia de una operación CRUD persistida en Atlas.

## Backend

Estado: PARCIAL.

Render `https://erp-azul-api.onrender.com/health` respondió HTTP 200 después de que el primer intento expiró, con respuesta `{"status":"ok"}`. El payload no incluye estado de MongoDB y no coincide con la versión local actual; los cambios no se han desplegado. El Blueprint está configurado con plan `free`, que puede suspender el servicio por inactividad.

## Base de datos

Estado: BLOQUEADO EXTERNO.

La aplicación usa `MONGO_URI`; no se abrió el valor local ni se ejecutó el smoke test, porque este crea registros persistentes y no se confirmó que la base configurada sea desechable. La conexión persistente del servicio Render a Atlas no está demostrada por la respuesta health existente.

## Productos

Estado: PARCIAL.

CRUD de servicio, aislamiento por empresa, SKU conflicto, actualización y soft delete cubiertos con tests de servicio; UI con alta/lista/edición/desactivación y actualización de lista. Falta ejecutar el ciclo contra una base de prueba. El índice SKU actual es global, no por empresa.

## Usuarios

Estado: PARCIAL.

Alta, lectura tenant-scoped, actualización allowlisted, hash, exclusión del hash en JSON y desactivación lógica cubiertos mediante tests aislados. La UI permite alta/lista/edición/desactivación, evita mostrar la acción sobre la propia cuenta y oculta roles con permisos de plataforma. Falta API + Mongo real.

## Inventario

Estado: PARCIAL.

Tests aislados comprueban stock inicial 20 → entrada +10 = 30 → salida -4 = 26 → ajuste +4 = 30 y rechazo de salida que causaría stock negativo. El modelo vigente conserva una existencia agregada del producto, no existencias separadas por almacén.

## Movimientos

Estado: PARCIAL.

Las operaciones registran producto, empresa, bodega, tipo, cantidad, stock anterior/nuevo, actor y fecha. La reversión añade movimiento compensatorio y no permite revertir dos veces. Las pruebas simulan `withTransaction`; falta verificar commit/rollback real en MongoDB replica set.

## Seguridad, RBAC y multi-tenancy

Estado: PARCIAL.

Tests verifican contexto tenant desde JWT, rechazo de acceso a otro tenant en servicio, permisos RBAC y restricción de permisos de plataforma. No se hizo prueba de penetración ni se validaron roles/datos reales del entorno productivo.

## Auditoría

Estado: PARCIAL.

La prueba de middleware verifica auditoría para mutaciones exitosas, atribución usuario/empresa y redacción de secretos; deja fuera errores y auth. La persistencia live no está verificada.

## Mobile / iOS

Estado: PARCIAL.

El export web y el bundle JS iOS pasan. La app usa SecureStore nativo; el bundleIdentifier existente `mx.uptx.erp` no se cambió. EAS tiene perfil production apuntando a HTTPS. No se ha hecho build firmado, instalación en iPhone ni prueba de sesión tras reinicio en dispositivo. No hay arte final de icono/splash; no se inventó uno.

Comando de build previsto:

```bash
cd client
npx eas-cli build --platform ios --profile production
```

Requiere sesión/proyecto EAS y credenciales/provisioning Apple válidos.

## Producción y pendientes externos

- El endpoint público de Render está accesible, pero sirve una versión anterior. Los cambios locales requieren publicarse en la rama conectada al Blueprint para desplegarse.
- Configurar/verificar `MONGO_URI` en Render con un URI de MongoDB Atlas persistente y acceso de red limitado a las IPs salientes de Render.
- Render genera los secretos JWT mediante Blueprint, pero deben comprobarse en el entorno desplegado sin copiarlos al repositorio.
- Cambiar el plan gratuito requiere aprobación de costo para evitar el sleep si se exige servicio siempre activo.
- Para probar CRUD/E2E, apuntar un entorno de prueba desechable a MongoDB; no ejecutar `server/scripts/smoke.js` contra una base no identificada.
- EAS/Apple: login, provisioning y build/install en iPhone.
- Branding final: entregar icono cuadrado de 1024×1024 PNG y arte splash aprobado para configurar los paths de assets.

## Cómo ejecutar desarrollo

```bash
cd "/Users/alexisreyes/Desktop/PROYECTO DIPLOMADO/erp-system"
npm run dev:server
npm run dev:client
```

El `.env` local del cliente sigue siendo local; no se imprime ni se reemplaza. Los perfiles EAS production y Render fijan la URL HTTPS pública.

## Producción

- API configurada: `https://erp-azul-api.onrender.com`
- Web configurada: `https://erp-azul-web.onrender.com`
- API verificada: health HTTP 200 en la instancia existente, pero sin comprobación de base de datos y sin verificar la versión local actual.
