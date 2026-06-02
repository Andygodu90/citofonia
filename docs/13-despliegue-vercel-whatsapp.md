# Despliegue Vercel y WhatsApp real

Objetivo:
Pasar del piloto local a una prueba con URL publica para que Meta pueda enviar webhooks y la app use el backend desplegado.

## Vercel

Repositorio:

```text
https://github.com/Andygodu90/citofonia.git
```

Configuracion recomendada en Vercel:

- Framework: Next.js.
- Root directory: `apps/api`.
- Build command: `npm run build`.
- Install command: `npm install`.
- Output: automatico de Next.js.

Variables requeridas en Vercel:

```text
DATABASE_URL
AUTH_SECRET
WHATSAPP_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_VERIFY_TOKEN
```

Importante:

- No pegar tokens en GitHub.
- Rotar cualquier token que se haya compartido por chat antes del piloto real.
- `AUTH_SECRET` debe tener minimo 32 caracteres.

## Health check

Despues del despliegue abrir:

```text
https://TU-DOMINIO.vercel.app/api/health
```

Debe responder:

```json
{
  "ok": true,
  "service": "citofonia-api"
}
```

El detalle incluye:

- Conexion a Neon.
- Configuracion de `AUTH_SECRET`.
- Configuracion de WhatsApp sin mostrar secretos.

## Webhook WhatsApp

URL para Meta:

```text
https://TU-DOMINIO.vercel.app/api/whatsapp/webhook
```

Token de verificacion:

```text
WHATSAPP_VERIFY_TOKEN
```

Este token lo defines tu. Debe ser una palabra/frase secreta, por ejemplo:

```text
arcadas_webhook_2026_seguro
```

Debe estar igual en:

- Variables de entorno de Vercel.
- Configuracion del webhook en Meta.

## Envio de mensajes

La app movil ahora permite:

- Enviar texto.
- Enviar plantilla WhatsApp.

Regla de Meta:

- Texto libre funciona si el residente ya escribio al WhatsApp del negocio dentro de la ventana permitida.
- Para iniciar conversacion desde porteria, normalmente se requiere plantilla aprobada.

Plantilla esperada por defecto:

```text
solicitud_autorizacion_ingreso
```

Idioma:

```text
es_CO
```

Contenido sugerido para Meta:

```text
Porteria Arcadas: {{1}}
```

Uso:

- En la app, escribir el mensaje operativo.
- Pulsar `Enviar plantilla WhatsApp`.
- El backend enviara la plantilla y guardara el historial.

## Prueba real recomendada

1. Desplegar backend en Vercel.
2. Configurar variables de entorno.
3. Abrir `/api/health`.
4. Crear o aprobar la plantilla en Meta.
5. Configurar webhook en Meta.
6. Enviar mensaje a `35 1C` desde la app usando plantilla.
7. Responder desde WhatsApp del residente.
8. Cargar historial en la app.

## Limitaciones actuales

- La entrega real depende de Meta y del estado de la plantilla.
- El webhook solo recibira mensajes si Meta apunta a una URL publica.
- El telefono del residente debe estar correctamente guardado en formato Colombia `+57`.
