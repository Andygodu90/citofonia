# Bloques 14 y 15 - App de residentes, calidad y produccion

## Bloque 14 - App de residentes

Estado actual:
- Existe rol `resident`.
- El usuario residente queda ligado a un registro de `residents`.
- El residente puede iniciar sesion en la misma app movil.
- La app muestra un panel distinto cuando el rol es residente.
- El residente puede ver solicitudes pendientes de su unidad.
- El residente puede aprobar o rechazar ingresos.
- El residente puede crear visitantes previamente autorizados.
- El residente puede ver historial reciente de su unidad.

Usuario de prueba:

```text
Usuario: residente
Contrasena: Residente123*
Unidad: Bloque 31 - Apto 1A
```

Crear o actualizar el usuario:

```powershell
cd apps/api
npm.cmd run db:seed:resident
```

Endpoints:

```text
GET  /api/resident/dashboard
POST /api/resident/authorizations/:id/decision
POST /api/resident/visitors
```

Todos requieren:

```text
Authorization: Bearer TOKEN_RESIDENTE
```

## Bloque 15 - Calidad, pruebas y preparacion para produccion

Comandos de verificacion local:

```powershell
cd apps/api
npm.cmd run lint
npm.cmd run build
```

```powershell
cd apps/mobile
npx.cmd tsc --noEmit
```

Prueba smoke del backend:

```powershell
cd apps/api
npm.cmd run test:smoke
```

Antes de ejecutar `test:smoke`, el backend debe estar corriendo:

```powershell
cd apps/api
npm.cmd run dev
```

Tambien deben existir los usuarios:

```powershell
npm.cmd run db:seed:porter
npm.cmd run db:seed:admin
npm.cmd run db:seed:resident
```

## Preparacion para piloto

Checklist minimo:

- Cambiar credenciales de prueba.
- Rotar cualquier credencial compartida durante desarrollo.
- Configurar variables reales en Vercel.
- Configurar dominio HTTPS para WhatsApp webhook.
- Validar permisos de admin, porteria y residente.
- Probar en celular Android fisico con red estable.
- Decidir estrategia final de llamadas: SIM nativa o VoIP.
- Crear build Android propia antes de modo kiosco.
- Hacer copia de seguridad o exportacion inicial de Neon.
- Definir politica de soporte para porteria.

## Limitaciones conocidas

- Expo Go es suficiente para desarrollo, pero no para modo kiosco real.
- WhatsApp real requiere Meta Business, numero habilitado y webhook HTTPS.
- Llamadas dentro de la app requieren build nativa o proveedor VoIP.
- La app de residentes es MVP: aun falta notificaciones push y recuperacion de contrasena.
