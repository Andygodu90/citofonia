# Panel administrativo web

## Ruta

```text
http://localhost:3000/admin
```

## Usuario de prueba

```text
Usuario: admin
Contrasena: Admin123*
Rol: admin
```

Crear o actualizar el usuario:

```powershell
cd apps/api
npm.cmd run db:seed:admin
```

## Funciones actuales

- Login administrativo.
- Resumen general:
  - unidades
  - residentes
  - usuarios
  - visitantes
  - ingresos pendientes
  - visitantes dentro
- Busqueda de unidades.
- Seleccion de unidad.
- Creacion de residentes con contacto principal.
- Busqueda de residentes.
- Listado de usuarios.
- Creacion o actualizacion de usuarios de porteria y administracion.
- Reportes operativos:
  - solicitudes de visita
  - aprobaciones
  - rechazos
  - entradas
  - salidas
  - llamadas
- Auditoria reciente de acciones sensibles.

## Endpoints administrativos

```text
GET  /api/admin/summary
GET  /api/admin/units
GET  /api/admin/residents
POST /api/admin/residents
GET  /api/admin/users
POST /api/admin/users
GET  /api/admin/reports
GET  /api/admin/audit
```

Todos requieren:

```text
Authorization: Bearer TOKEN_ADMIN
```

## Alcance de esta etapa

Este panel cubre la administracion inicial del conjunto. Todavia no reemplaza un panel administrativo final completo, pero ya permite mantener usuarios y residentes sin editar la base de datos manualmente.
