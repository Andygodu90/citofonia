# Tareas pendientes de mi parte

Este archivo resume exactamente que debo conseguir, crear o diligenciar para que Codex pueda continuar con las pruebas reales y el despliegue.

## 1. Revisar y completar variables locales del backend

Archivo local a diligenciar:

```text
apps/api/.env.local
```

Archivo guia, sin secretos reales:

```text
apps/api/.env.example
```

Variables que deben existir en `apps/api/.env.local`:

```text
DATABASE_URL=
AUTH_SECRET=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_TEMPLATE_AUTHORIZATION_NAME=
WHATSAPP_TEMPLATE_AUTHORIZATION_LANGUAGE=
APP_PUBLIC_BASE_URL=
APP_ALLOWED_ORIGINS=
```

Notas:

- `DATABASE_URL`: cadena de conexion de Neon.
- `AUTH_SECRET`: secreto largo de minimo 32 caracteres.
- `WHATSAPP_ACCESS_TOKEN`: token vigente de Meta/WhatsApp.
- `WHATSAPP_PHONE_NUMBER_ID`: ID del numero de WhatsApp Business.
- `WHATSAPP_VERIFY_TOKEN`: token inventado por mi para verificar el webhook en Meta.
- `WHATSAPP_TEMPLATE_AUTHORIZATION_NAME`: por ahora debe coincidir con la plantilla aprobada en Meta.
- `WHATSAPP_TEMPLATE_AUTHORIZATION_LANGUAGE`: por ahora `es_CO`.
- `APP_PUBLIC_BASE_URL`: URL publica del backend cuando se despliegue en Vercel.
- `APP_ALLOWED_ORIGINS`: origenes permitidos para la app web local.

Comando para que Codex valide cuando yo confirme que todo esta diligenciado:

```text
cd apps/api
npm run check:pilot
```

## 2. Rotar credenciales que fueron compartidas por chat

Debo rotar o regenerar cualquier credencial sensible que haya sido pegada en la conversacion.

Prioridad:

- Token de WhatsApp/Meta.
- Password o cadena de conexion de Neon si fue compartida completa.
- Cualquier secreto que pueda dar acceso a base de datos o API.

Despues de rotar, debo actualizar:

```text
apps/api/.env.local
```

Cuando el backend este en Vercel, tambien debo actualizar esas mismas variables en:

```text
Vercel > Proyecto citofonia > Settings > Environment Variables
```

## 3. Crear o terminar el proyecto en Vercel

Repositorio que debe conectarse:

```text
https://github.com/Andygodu90/citofonia.git
```

Configuracion del proyecto en Vercel:

```text
Root directory: apps/api
Framework: Next.js
Build command: npm run build
Install command: npm install
```

Variables que debo pegar en Vercel:

```text
DATABASE_URL
AUTH_SECRET
WHATSAPP_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_VERIFY_TOKEN
WHATSAPP_TEMPLATE_AUTHORIZATION_NAME
WHATSAPP_TEMPLATE_AUTHORIZATION_LANGUAGE
APP_PUBLIC_BASE_URL
APP_ALLOWED_ORIGINS
```

Cuando Vercel entregue la URL publica, debo copiarla y usarla para:

```text
APP_PUBLIC_BASE_URL=https://TU-DOMINIO.vercel.app
```

Tambien debo informarle esa URL a Codex para que actualice lo necesario.

## 4. Verificar health check publico

Cuando Vercel este desplegado, debo abrir:

```text
https://TU-DOMINIO.vercel.app/api/health
```

Resultado esperado:

```text
ok: true
```

Si algo aparece como pendiente o falso, debo copiar el resultado y pasarselo a Codex.

## 5. Configurar WhatsApp Business Cloud API en Meta

Debo tener estos datos desde Meta:

```text
WHATSAPP_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID
```

Debo pegarlos en:

```text
apps/api/.env.local
```

Y despues en:

```text
Vercel > Environment Variables
```

Notas:

- El token debe estar vigente.
- Si el token es temporal, puede caducar y fallar el envio.
- Para piloto real conviene usar token permanente o de sistema cuando Meta lo permita.

## 6. Crear o aprobar plantilla WhatsApp

Plantilla esperada actualmente por el backend:

```text
solicitud_autorizacion_ingreso
```

Idioma:

```text
es_CO
```

Variables relacionadas:

```text
WHATSAPP_TEMPLATE_AUTHORIZATION_NAME=solicitud_autorizacion_ingreso
WHATSAPP_TEMPLATE_AUTHORIZATION_LANGUAGE=es_CO
```

Archivos donde se documenta esto:

```text
apps/api/.env.example
docs/13-despliegue-vercel-whatsapp.md
docs/14-avance-pasos-1-5.md
```

Debo confirmar en Meta que la plantilla este aprobada antes de probar mensajes iniciados desde porteria.

## 7. Configurar webhook publico de WhatsApp en Meta

Cuando Vercel este listo, la URL para Meta sera:

```text
https://TU-DOMINIO.vercel.app/api/whatsapp/webhook
```

Token de verificacion:

```text
WHATSAPP_VERIFY_TOKEN
```

Ese mismo valor debe estar igual en:

```text
apps/api/.env.local
Vercel > Environment Variables
Meta > Webhook verify token
```

Cuando Meta verifique el webhook, debo avisarle a Codex para hacer prueba de respuestas entrantes.

## 8. Confirmar numero real para pruebas WhatsApp

Unidad usada anteriormente para prueba:

```text
Bloque 35 - Apto 1C
```

Numero de prueba:

```text
3148337748
```

Debo confirmar si este numero sigue siendo el correcto.

Si cambia, debo pedirle a Codex que actualice el residente/contacto correspondiente en Neon.

## 9. Preparar cuenta EAS para build Android

Archivo de configuracion:

```text
apps/mobile/eas.json
```

Archivo de identidad de la app:

```text
apps/mobile/app.json
```

Package Android actual:

```text
com.arcadas.citofonia
```

Tarea de mi parte:

- Confirmar que tengo cuenta Expo/EAS.
- Iniciar sesion cuando Codex lo solicite.
- Autorizar build si la terminal pide login.

Comando que se usara despues:

```text
cd apps/mobile
npm run build:android:preview
```

## 10. Confirmar estrategia de llamadas reales

Decision pendiente:

```text
SIM nativa / Dialer Android
o
VoIP / SIP / PBX
```

Documento relacionado:

```text
docs/15-decision-llamadas-reales.md
```

Recomendacion actual:

- Si debe ser totalmente dentro de la app: evaluar VoIP/SIP/PBX.
- Si se acepta abrir o controlar dialer Android: evaluar SIM nativa.

Debo decidir cual camino tomar antes de que Codex implemente llamadas reales.

## 11. Datos reales para piloto controlado

Debo definir:

- 5 a 10 apartamentos reales para piloto.
- Nombre de residentes reales.
- Telefonos WhatsApp en formato Colombia.
- Porteria o porterias que participaran.
- Usuario real de porteria.

Archivo/documento relacionado:

```text
docs/16-piloto-controlado-porteria.md
```

Si tengo los datos en CSV, Codex puede ayudar a cargarlos usando el flujo de carga masiva.

## 12. Lo que Codex puede hacer cuando yo entregue lo anterior

Cuando yo entregue credenciales/URLs confirmadas, Codex puede:

- Validar variables locales.
- Ejecutar `npm run check:pilot`.
- Probar `/api/health`.
- Probar envio WhatsApp.
- Probar webhook entrante.
- Ajustar la app para usar backend publico.
- Preparar build Android preview.
- Continuar organizando vistas por rol.

## Estado actual

Pendiente de mi parte antes de piloto real:

- Rotar token de WhatsApp.
- Confirmar credenciales Meta finales.
- Crear/desplegar backend en Vercel.
- Copiar variables a Vercel.
- Aprobar plantilla WhatsApp.
- Configurar webhook en Meta.
- Confirmar numero real de prueba.
- Definir estrategia de llamadas reales.
