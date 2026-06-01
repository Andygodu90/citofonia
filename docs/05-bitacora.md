# Bitacora

## 2026-06-01

- Se instalo Node.js LTS.
- Se instalo OpenSpec.
- Se inicializo OpenSpec para Codex.
- Se instalo Git.
- Se instalo GitHub CLI.
- Se instalo Vercel CLI.
- Se instalo EAS CLI.
- Se creo documentacion base en Markdown.
- Android Studio queda pendiente porque la instalacion con winget no finalizo dentro del tiempo disponible.
- Se inicializo Git local.
- Se creo `apps/mobile` con Expo y TypeScript.
- Se creo `apps/api` con Next.js y TypeScript.
- Se agrego endpoint `GET /api/health`.
- Se verifico TypeScript en la app movil.
- Se verifico lint y build en el backend.
- Se conecto Neon usando `apps/api/.env.local`.
- Se creo `apps/api/database/schema.sql`.
- Se ejecuto `npm.cmd run db:init` y las tablas iniciales quedaron creadas en Neon.
- Se cargaron 300 unidades de prueba para Arcadas de San Isidro.
- Se crearon endpoints de busqueda, detalle protegido, llamada y mensaje para porteria.
- Se conecto la app movil al backend para el primer flujo MVP.
- Se agrego login basico de porteria con token firmado.
- Se creo usuario de prueba `porteria`.
- Se protegieron los endpoints de porteria con token Bearer.
- Se agrego registro de visitantes desde porteria.
- El registro de visitantes crea autorizacion y evento de acceso pendientes.
- Se ajusto la seleccion de unidad para ocultar la lista despues de elegir un apartamento.
- Se agrego historial reciente de porteria.
- Se convirtio el historial reciente en acordeon para abrir/cerrar el listado.
