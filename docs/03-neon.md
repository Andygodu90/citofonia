# Base de datos Neon

## Estado actual

Neon quedo conectado localmente y el esquema inicial fue creado correctamente.

La conexion privada esta en:

```text
apps/api/.env.local
```

Ese archivo no se debe subir a GitHub.

## Archivos importantes

```text
apps/api/database/schema.sql
apps/api/scripts/init-db.mjs
apps/api/scripts/check-db.mjs
apps/api/.env.example
```

## Comandos

Crear o actualizar las tablas:

```powershell
cd apps/api
npm.cmd run db:init
```

Verificar las tablas creadas:

```powershell
cd apps/api
npm.cmd run db:check
```

## Tablas iniciales

El esquema actual crea:

- `properties`
- `residential_units`
- `residents`
- `resident_contacts`
- `app_users`
- `visitors`
- `access_authorizations`
- `access_events`
- `call_logs`
- `whatsapp_threads`
- `whatsapp_messages`
- `security_reports`
- `audit_events`

## Reglas de privacidad

- La app de porteria no debe listar telefonos.
- La app de porteria no debe mostrar nombres completos.
- El backend decide que contacto se usa para llamada o mensaje.
- Todo intento de contacto debe quedar en auditoria.

## Nota de seguridad

Si una cadena de conexion se comparte por error en un chat, correo o documento, conviene rotar la contrasena en Neon y actualizar `DATABASE_URL`.
