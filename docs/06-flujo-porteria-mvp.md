# Flujo MVP de porteria

## Objetivo

Crear el primer flujo funcional para que porteria pueda:

1. Iniciar sesion como usuario de porteria.
2. Buscar una unidad residencial.
3. Ver informacion protegida.
4. Registrar un intento de llamada.
5. Registrar un visitante con autorizacion pendiente.
6. Aprobar o rechazar ingresos pendientes.
7. Registrar entrada efectiva.
8. Registrar salida.
9. Guardar un mensaje interno de prueba.
10. Consultar historial reciente de porteria.

## Usuario de prueba

```text
Usuario: porteria
Contrasena: Porteria123*
Rol: porter
```

Este usuario se crea o actualiza con:

```powershell
cd apps/api
npm.cmd run db:seed:porter
```

## Datos de prueba

Se cargaron datos para:

- Conjunto Residencial Arcadas de San Isidro.
- 15 bloques: del 31 al 45.
- 5 pisos por bloque.
- 4 apartamentos por piso: A, B, C y D.
- Total: 300 unidades.
- 300 residentes ficticios.
- 300 contactos ficticios protegidos.

Ejemplos de busqueda:

```text
31
31 1A
45 5D
1A
```

## Comandos de base de datos

Crear tablas:

```powershell
cd apps/api
npm.cmd run db:init
```

Cargar datos de Arcadas:

```powershell
cd apps/api
npm.cmd run db:seed:arcadas
```

Verificar tablas:

```powershell
cd apps/api
npm.cmd run db:check
```

## Endpoints creados

```text
POST /api/auth/login
GET  /api/porter/units?query=31%201A
GET  /api/porter/units/:id
POST /api/porter/units/:id/calls
POST /api/porter/units/:id/messages
POST /api/porter/units/:id/visitors
GET  /api/porter/history
GET  /api/porter/authorizations
POST /api/porter/authorizations/:id/decision
GET  /api/porter/movements
POST /api/porter/movements/:id/entry
POST /api/porter/movements/:id/exit
```

Los endpoints de porteria requieren:

```text
Authorization: Bearer TOKEN
```

## Registro de visitantes

El flujo actual permite registrar:

- Nombre del visitante.
- Documento.
- Telefono.
- Tipo de visitante.
- Motivo de visita.
- Unidad a visitar.

Al registrar un visitante se crean tres registros:

- `visitors`: datos del visitante.
- `access_authorizations`: autorizacion inmediata en estado `pending`.
- `access_events`: solicitud de ingreso en estado `pending`.

Tambien se registra un evento de auditoria con accion:

```text
porter.visitor.create
```

La aprobacion o rechazo del residente se implementara en una fase posterior.

## Ingresos pendientes

La app muestra un acordeon de ingresos pendientes. Desde ese panel porteria puede:

- Ver solicitudes pendientes.
- Aprobar ingreso.
- Rechazar ingreso.
- Actualizar la lista.

Cuando se aprueba o rechaza, el backend actualiza:

- `access_authorizations.status`
- `access_events.status`
- `audit_events`

Estados actuales:

```text
pending
approved
rejected
```

En esta etapa la decision se hace desde porteria. En una fase posterior se conectara con respuesta del residente por WhatsApp Business o app de residente.

## Entradas y salidas

La app incluye un acordeon de entradas y salidas.

Desde este panel porteria puede:

- Ver visitantes aprobados pendientes de entrada.
- Registrar entrada efectiva.
- Ver visitantes que ingresaron y no han salido.
- Registrar salida.

Estados principales del flujo:

```text
pending -> approved -> entered -> completed
pending -> rejected
```

Cada entrada y salida crea un registro en `access_events` y un evento de auditoria.

## Historial de porteria

El historial reciente combina:

- Visitantes registrados.
- Llamadas registradas.
- Mensajes internos.

El endpoint devuelve los ultimos 25 eventos ordenados por fecha descendente.

En la app movil el historial se muestra como acordeon:

- Cerrado por defecto.
- El usuario puede abrirlo cuando necesite revisar eventos.
- El usuario puede cerrarlo para mantener limpia la pantalla de operacion.
- Al abrirlo por primera vez, la app carga el historial reciente.

## Ajuste de seleccion de unidad

Cuando se busca por bloque, por ejemplo `31`, la app muestra la lista completa de apartamentos del bloque. Al seleccionar una unidad, la lista se oculta y queda visible solo la unidad activa con su informacion operativa debajo.

Para volver a la lista o escoger otra unidad, usar el boton:

```text
Cambiar unidad
```

## Probar backend

```powershell
cd apps/api
npm.cmd run dev
```

Abrir:

```text
http://localhost:3000/api/porter/units?query=31%201A
```

## Probar app movil

```powershell
cd apps/mobile
npm.cmd start
```

En Expo Go, si usas un celular fisico, cambia el campo `Servidor API` dentro de la app por la IP del computador.

Ejemplo:

```text
http://192.168.1.25:3000
```

El celular y el computador deben estar en la misma red Wi-Fi.

## Variables de entorno

El backend requiere:

```text
DATABASE_URL
AUTH_SECRET
```

`AUTH_SECRET` debe ser un texto largo y privado. En local ya fue generado en `.env.local`.
