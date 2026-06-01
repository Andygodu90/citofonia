# Flujo MVP de porteria

## Objetivo

Crear el primer flujo funcional para que porteria pueda:

1. Buscar una unidad residencial.
2. Ver informacion protegida.
3. Registrar un intento de llamada.
4. Guardar un mensaje interno de prueba.

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
GET  /api/porter/units?query=31%201A
GET  /api/porter/units/:id
POST /api/porter/units/:id/calls
POST /api/porter/units/:id/messages
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

