# Bloques 11, 12 y 13 - Comunicacion real, kiosco Android y llamadas

## Bloque 11 - WhatsApp Business Cloud API

Estado actual:
- La app de porteria ya guarda mensajes por unidad.
- El backend ya puede enviar por WhatsApp Cloud si existen credenciales.
- Si no hay credenciales, funciona en modo simulacion y guarda historial interno.
- Existe webhook para verificar Meta y recibir respuestas.
- El backend ya soporta envio por texto libre y por plantilla.
- El webhook ya puede actualizar estados del proveedor como entregado o leido.

Variables requeridas en `apps/api/.env.local`:

```env
WHATSAPP_ACCESS_TOKEN=""
WHATSAPP_PHONE_NUMBER_ID=""
WHATSAPP_VERIFY_TOKEN=""
```

Webhook para Meta:

```txt
https://TU_DOMINIO/api/whatsapp/webhook
```

Para pruebas locales con Meta se requiere exponer el backend con HTTPS publico, por ejemplo usando una URL temporal o desplegando en Vercel. En local sin HTTPS, la app sigue funcionando en modo simulacion.

## Pruebas de envio

WhatsApp Cloud tiene dos caminos:

1. Texto libre:
   - Solo funciona si el residente ya escribio primero al numero de WhatsApp Business.
   - Abre una ventana de conversacion de 24 horas.
   - Es util para pruebas rapidas.

2. Plantilla:
   - Sirve para iniciar conversaciones cuando el residente no ha escrito primero.
   - Debe ser creada y aprobada en Meta.
   - El backend puede enviar una plantilla con `sendMode: "template"`.

Plantilla sugerida:

```text
Nombre: solicitud_autorizacion_ingreso
Idioma: es_CO
Texto: Hola, porteria solicita confirmar el ingreso de {{1}} a tu unidad. Responde APROBAR o RECHAZAR.
Categoria: Utility
```

Cuando la plantilla este aprobada, el backend podra enviar:

```json
{
  "message": "Visitante Juan Perez",
  "sendMode": "template",
  "templateName": "solicitud_autorizacion_ingreso",
  "languageCode": "es_CO"
}
```

## Estados de entrega

La tabla `whatsapp_messages` guarda:

- `message_type`: `text` o `template`
- `provider_status`: estado reportado por Meta
- `provider_message_id`: identificador `wamid...`
- `delivered_at`
- `read_at`

Para recibir estados reales, el webhook debe estar publicado en HTTPS:

```text
https://TU_DOMINIO/api/whatsapp/webhook
```

## Bloque 12 - Modo kiosco Android

Expo Go no puede:
- Iniciar automaticamente al encender el celular.
- Bloquear el boton de inicio.
- Impedir que el usuario abra otras apps.
- Activar Lock Task Mode de Android.

Para modo kiosco real se debe crear una build propia Android. Ruta recomendada:

1. Mantener Expo Go solo para desarrollo y pruebas rapidas.
2. Crear APK/AAB propia con EAS Build.
3. Evaluar `expo prebuild` cuando necesitemos codigo nativo.
4. Configurar el equipo como dispositivo dedicado con Android Enterprise o MDM.
5. Activar Lock Task Mode para permitir solo la app de citofonia.
6. Crear salida administrativa protegida por clave o usuario admin.

Paquete Android configurado:

```txt
com.arcadas.citofonia
```

## Bloque 13 - Llamadas reales con SIM o VoIP

Restriccion importante:
- Android no permite hacer una llamada normal por SIM completamente dentro de una app hecha en Expo Go.
- Una llamada por SIM normalmente abre el dialer o requiere que la app sea dialer predeterminada.
- Para no salir de la app, la ruta mas limpia es VoIP o central telefonica integrada.

Estrategia recomendada:

1. MVP actual: registrar intentos y resultado de llamada sin mostrar el numero.
2. Siguiente paso con SIM: build Android propia y evaluar app dialer predeterminada.
3. Ruta profesional: integrar VoIP/SIP o PBX para llamar dentro de la app.
4. En todos los casos, el numero real permanece en backend y no se muestra al celador.

Estados soportados actualmente:
- `initiated`
- `answered`
- `no_answer`
- `rejected`
- `failed`

Cada llamada queda en `call_logs` y puede aparecer en reportes administrativos.
