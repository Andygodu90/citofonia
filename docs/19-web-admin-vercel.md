# Web administrativa y app movil

## Separacion de trabajo

El proyecto queda organizado en dos frentes:

- `apps/mobile`: app de porteria y uso operativo movil.
- `apps/api`: API central, web administrativa y endpoints para Vercel.

La app movil y la web administrativa comparten la misma base de datos Neon.
Lo que se registre desde porteria queda disponible para la web, y lo que admin
configure desde la web afecta la operacion de porteria.

## Roles actuales

- `superadmin`: administra usuarios, roles y vista global.
- `admin`: administra el conjunto asignado.
- `porter`: opera desde la app movil.

Por ahora el rol `resident` queda fuera del alcance principal solicitado para la
web administrativa.

## Web administrativa

Ruta local:

```text
http://localhost:3000/admin
```

Ruta esperada en Vercel:

```text
https://citofonia.julissasantis.com/admin
```

Modulos base:

- Dashboard con resumen general.
- Roles y usuarios.
- Residentes.
- Unidades y bloqueos.
- Mensajeria por WhatsApp.
- Reportes.

## Notificaciones push

La app movil registra el token push del dispositivo despues de iniciar sesion.
Ese token queda asociado al usuario, rol y conjunto para poder enviar avisos
operativos.

Eventos cubiertos:

- Bloqueo o desbloqueo de una unidad: notifica al rol `porter`.
- Mensajes enviados desde porteria o recibidos por WhatsApp: notifica a
  `porter`, `admin`, `superadmin` y residentes relacionados cuando tengan token
  registrado.

Las notificaciones se guardan primero en la base de datos. Si Expo Push no esta
disponible, el evento queda registrado para auditoria y reintentos futuros.

## Bloqueos de unidades

El bloqueo se maneja por unidad y no tiene fecha de caducidad.
Se levanta manualmente desde la web administrativa.

Cuando se bloquea o desbloquea una unidad, el sistema registra una notificacion
para el rol `porter`. Si el dispositivo de porteria ya registro token push, se
intenta enviar notificacion Expo.

## Privacidad hacia porteria

Cada residente tiene dos banderas independientes:

- Mostrar nombre a porteria.
- Mostrar telefono a porteria.

Por defecto ambas quedan desactivadas.

## Vehiculos por unidad

Cada unidad puede tener:

- Placa de automotor.
- Placa de motocicleta.

## Reportes

El endpoint de reportes permite exportar:

- Actividad operativa.
- Listado de unidades.
- Listado de unidades bloqueadas.

Formatos:

- CSV.
- Excel `.xlsx`.
- PDF.

Nota tecnica: no se usan librerias `.jar` como Apache POI u OpenPDF porque la
web corre en Next.js/Vercel sobre Node.js. Se usan equivalentes compatibles con
Vercel: `xlsx` y `pdfkit`.

## Pendiente para publicar

1. Subir cambios a GitHub.
2. Crear proyecto en Vercel desde el repositorio.
3. Agregar variables de entorno en Vercel:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `WHATSAPP_ACCESS_TOKEN`
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_VERIFY_TOKEN`
   - plantillas de WhatsApp aprobadas.
4. Ejecutar migracion de base de datos cuando Neon responda correctamente.
5. Crear subdominio DNS:

```text
citofonia.julissasantis.com
```

6. Conectar ese subdominio en Vercel.
