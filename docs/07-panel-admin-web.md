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

## Endpoints administrativos

```text
GET  /api/admin/summary
GET  /api/admin/units
GET  /api/admin/residents
POST /api/admin/residents
GET  /api/admin/users
POST /api/admin/users
```

Todos requieren:

```text
Authorization: Bearer TOKEN_ADMIN
```

## Alcance de esta etapa

Este panel cubre la administracion inicial del conjunto. Todavia no reemplaza un panel administrativo final completo, pero ya permite mantener usuarios y residentes sin editar la base de datos manualmente.

