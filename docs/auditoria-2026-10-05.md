# Auditoría técnica — SYS ERP
Fecha: 2026-10-05

## Alcance
Revisión del código publicado en `main` del repositorio. Esta auditoría no incluye cambios locales no subidos desde la Mac del desarrollador.

## Hallazgos críticos corregidos en esta rama

1. **Aislamiento multiempresa: companyId controlado por el cliente (ALTO).**
   Varios controladores aceptaban `companyId` desde query/body antes que el tenant autenticado.
   Se endureció `authenticate` para que un usuario ligado a empresa nunca pueda sustituir el tenant de su JWT.

2. **IDOR en usuarios (ALTO).**
   `GET/PUT /users/:id` podía operar por id sin verificar empresa.
   Ahora lectura y edición filtran por la empresa autenticada.

3. **Escalación de privilegios al asignar roles (ALTO).**
   La creación/edición de usuarios podía recibir cualquier `roleId`.
   Ahora un rol wildcard (`*`) solo puede ser asignado por un actor que ya tenga wildcard.

4. **IDOR en facturación (ALTO).**
   La creación de factura podía recibir una orden de venta de otra empresa y el cambio de estado operaba solo por id.
   Ambas operaciones quedan ligadas al `companyId` autenticado.

5. **Configuración móvil de API (OPERATIVO).**
   El fallback era `localhost` para todas las plataformas y obligaba a cambiar manualmente Android/iOS.
   Ahora Android Emulator usa `10.0.2.2`; iOS Simulator/web usan `localhost`; dispositivos físicos deben configurar `EXPO_PUBLIC_API_URL`.

6. **Pruebas/CI inexistentes o no ejecutables (ALTO).**
   Se agregó una prueba de seguridad para impedir override de tenant, se corrigió el script de tests y se añadió GitHub Actions.

## Hallazgos pendientes antes de llamar al sistema “100% producción”

- Revisar y cerrar IDOR por id en el resto de servicios CRUD (productos, sucursales, almacenes, proveedores, clientes, empleados, asistencias, órdenes, cuentas y pólizas).
- Diseñar formalmente la diferencia entre administrador de plataforma y administrador de empresa; hoy los roles son globales.
- Sustituir la contraseña demo fija del seed por una credencial de bootstrap configurable y rotatoria para producción.
- Añadir rate limiting a login/refresh y cabeceras HTTP de endurecimiento.
- Definir revocación de refresh tokens/sesiones; actualmente el refresh es stateless.
- Añadir pruebas de integración multiempresa con dos compañías y pruebas negativas de acceso cruzado.
- Ejecutar `npm audit`, pruebas unitarias, smoke test contra Atlas y Expo Doctor en el entorno local/CI antes de merge.
- Verificar CORS de producción y separar URLs de desarrollo, simulador, dispositivo físico y despliegue.

## Validación requerida

```bash
npm ci
npm test --workspace=server

# Con API + Atlas configurados y backend encendido:
npm run smoke --workspace=server
```

La rama de auditoría debe revisarse y validarse antes de merge a `main`.
