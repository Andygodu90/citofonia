# Checklist de piloto funcional

Objetivo:
Dejar claro que se puede probar hoy, que falta por credenciales externas y que pasos siguen antes de operar en produccion.

## URLs locales

Backend:

```text
http://localhost:3000
```

Backend en red local:

```text
http://192.168.80.27:3000
```

Expo Go:

```text
exp://192.168.80.27:8081
```

Panel administrativo:

```text
http://192.168.80.27:3000/admin
```

## Usuarios de prueba

Porteria:

```text
porteria / Porteria123*
```

Administrador:

```text
admin / Admin123*
```

Residente:

```text
residente / Residente123*
```

## Prueba movil de porteria

1. Abrir Expo Go.
2. Entrar a `exp://192.168.80.27:8081`.
3. En URL API colocar `http://192.168.80.27:3000`.
4. Iniciar sesion con porteria.
5. Buscar `35 1C`.
6. Seleccionar la unidad.
7. Registrar un visitante.
8. Abrir `Ingresos pendientes`.
9. Aprobar o rechazar.
10. Abrir `Entradas y salidas`.
11. Registrar entrada y salida.
12. Abrir `Historial reciente`.
13. Validar que el evento aparece.

## Prueba residente

1. Cerrar sesion.
2. Entrar con `residente / Residente123*`.
3. Ver solicitudes pendientes.
4. Aprobar o rechazar.
5. Crear un visitante autorizado.
6. Revisar historial de la unidad.

## Prueba administrativa

1. Abrir `/admin`.
2. Iniciar sesion con `admin / Admin123*`.
3. Buscar unidades y residentes.
4. Activar o desactivar una unidad de prueba.
5. Activar o desactivar un residente de prueba.
6. Crear o actualizar un usuario de porteria.
7. Validar un CSV de residentes con `Validar CSV`.
8. Ejecutar carga real solo con datos revisados.

## Estado tecnico actual

Listo para piloto local:

- Login por roles.
- Proteccion de endpoints.
- Busqueda protegida de unidades.
- Registro de visitantes.
- Aprobacion y rechazo.
- Entrada y salida.
- Historial operativo.
- Panel administrativo.
- Reportes y auditoria.
- App residente basica.
- Chat interno tipo WhatsApp.
- Envio WhatsApp preparado desde backend.
- Boton movil para enviar texto o plantilla WhatsApp.
- Webhook WhatsApp creado.
- Carga masiva de residentes por CSV.
- Configuracion inicial de EAS Build.

Depende de credenciales o decisiones externas:

- Recepcion real de WhatsApp si Meta no permite mensajes libres.
- Plantillas aprobadas de WhatsApp Business para iniciar conversaciones.
- URL publica del webhook en Vercel para recibir mensajes reales.
- Modo kiosco real Android.
- Llamadas reales dentro de la app con SIM o proveedor VoIP.

## Comandos de verificacion

Backend:

```powershell
cd apps/api
npm run lint
npm run build
npm run test:smoke
```

Mobile:

```powershell
cd apps/mobile
npx tsc --noEmit
npx expo-doctor
```

Estado del sistema:

```text
GET /api/health
```

El endpoint muestra:

- Conexion a base de datos.
- Estado de `AUTH_SECRET`.
- Configuracion de WhatsApp sin revelar secretos.
- Si `WHATSAPP_VERIFY_TOKEN` aparece pendiente, el envio puede funcionar pero el webhook publico aun no queda verificable en Meta.

## Build Android

El archivo `apps/mobile/eas.json` deja perfiles base:

- `development`: APK con dev client.
- `preview`: APK interno para instalar en celulares propios.
- `production`: AAB para publicacion formal.

Comandos futuros:

```powershell
cd apps/mobile
npx eas login
npx eas build --platform android --profile preview
```

## Bloqueos reales

WhatsApp:

- Si el residente no escribe primero, WhatsApp Cloud API exige plantilla aprobada para iniciar conversacion.
- El token pegado en el chat debe considerarse expuesto y conviene rotarlo antes de piloto real.

Kiosco:

- Expo Go no puede bloquear el celular.
- Se requiere build Android propia y configurar dispositivo dedicado o Lock Task Mode.

Llamadas:

- Una llamada SIM normal no se mantiene completamente dentro de Expo Go.
- Para llamada 100% dentro de la app, la ruta mas profesional es VoIP/SIP/PBX.
