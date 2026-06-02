# Avance de pasos 1 al 5

Fecha:
2 de junio de 2026.

Objetivo:
Iniciar la ruta de piloto controlado real desde el estado actual del proyecto.

## Paso 1 - Cierre de seguridad de credenciales

Estado:
Iniciado y preparado.

Hecho en el proyecto:
- Se agrego `WHATSAPP_TEMPLATE_AUTHORIZATION_NAME` a `.env.example`.
- Se agrego `WHATSAPP_TEMPLATE_AUTHORIZATION_LANGUAGE` a `.env.example`.
- Se agrego `APP_PUBLIC_BASE_URL` a `.env.example`.
- Se agrego script `npm run check:pilot` en `apps/api`.
- `/api/health` ahora muestra plantilla configurada y URL publica configurada.

Pendiente externo:
- Rotar el token de WhatsApp en Meta.
- Pegar el nuevo token en `apps/api/.env.local`.
- Pegar el nuevo token en variables de Vercel cuando se despliegue.

Comando local:

```powershell
cd apps/api
npm run check:pilot
```

Resultado esperado:
Todas las variables aparecen como `ok` y la base de datos responde.

## Paso 2 - Despliegue del backend en Vercel

Estado:
Preparado.

Configuracion para Vercel:
- Repositorio: `https://github.com/Andygodu90/citofonia.git`
- Root directory: `apps/api`
- Framework: Next.js
- Build command: `npm run build`
- Install command: `npm install`

Variables en Vercel:

```text
DATABASE_URL
AUTH_SECRET
WHATSAPP_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_VERIFY_TOKEN
WHATSAPP_TEMPLATE_AUTHORIZATION_NAME
WHATSAPP_TEMPLATE_AUTHORIZATION_LANGUAGE
APP_PUBLIC_BASE_URL
```

Pendiente externo:
- Crear proyecto en Vercel.
- Copiar variables.
- Confirmar URL publica final.
- Actualizar `APP_PUBLIC_BASE_URL` con la URL real.

Verificacion:

```text
https://TU-DOMINIO.vercel.app/api/health
```

## Paso 3 - Configurar WhatsApp real

Estado:
Preparado tecnicamente.

Hecho en el proyecto:
- Backend soporta texto libre.
- Backend soporta plantilla.
- App movil tiene boton `Texto`.
- App movil tiene boton `Enviar plantilla WhatsApp`.
- Webhook existe en `/api/whatsapp/webhook`.
- Health muestra nombre e idioma de plantilla.

Plantilla esperada:

```text
Nombre: solicitud_autorizacion_ingreso
Idioma: es_CO
Categoria: Utility
Texto sugerido: Porteria Arcadas: {{1}}
```

Pendiente externo:
- Crear plantilla en Meta.
- Esperar aprobacion.
- Configurar webhook usando URL de Vercel.
- Usar el mismo `WHATSAPP_VERIFY_TOKEN`.

Prueba:
- Buscar unidad `35 1C`.
- Escribir mensaje.
- Pulsar `Enviar plantilla WhatsApp`.
- Responder desde WhatsApp del residente.
- Pulsar `Cargar historial del chat`.

## Paso 4 - Preparar build Android propia

Estado:
Preparado para iniciar.

Hecho en el proyecto:
- Existe `apps/mobile/eas.json`.
- Se agregaron scripts:
  - `npm run doctor`
  - `npm run build:android:preview`
  - `npm run build:android:production`

Comandos:

```powershell
cd apps/mobile
npm run doctor
npx eas login
npm run build:android:preview
```

Pendiente externo:
- Iniciar sesion EAS.
- Generar APK.
- Instalar APK en celular Android.
- Validar flujo real.

Nota:
Expo Go sigue sirviendo para desarrollo, pero no para modo kiosco real.

## Paso 5 - Definir estrategia de llamadas reales

Estado:
Decision tecnica recomendada documentada.

Decision recomendada:
Usar VoIP/SIP/PBX como ruta principal si el requisito se mantiene como "llamar sin salirse de la app".

Motivo:
- Una llamada SIM normal suele abrir dialer.
- Para ocultar numero y mantener llamada dentro de UI propia, VoIP es mas limpio.
- VoIP permite registrar duracion, estados y trazabilidad con mayor control.

Ruta alternativa:
Evaluar SIM nativa solo si se acepta:
- Crear build Android propia.
- Agregar permisos nativos.
- Posible configuracion como dialer predeterminado.
- Riesgo de que el usuario vea una pantalla externa del sistema.

Siguiente decision de negocio:
Definir si el conjunto acepta un proveedor VoIP/PBX o si prefiere continuar con registro manual de llamadas mientras se prueba el piloto.
