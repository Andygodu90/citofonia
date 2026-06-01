# Flujo MVP de porteria

## Objetivo

Crear el primer flujo funcional para que porteria pueda:

1. Iniciar sesion como usuario de porteria.
2. Buscar una unidad residencial.
3. Ver informacion protegida.
4. Registrar un intento de llamada.
5. Guardar un mensaje interno de prueba.

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
```

Los endpoints de porteria requieren:

```text
Authorization: Bearer TOKEN
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
