# Build Android propio

Objetivo: dejar la app movil lista para probar fuera de Expo Go y preparar funciones nativas como llamadas por SIM.

## Estado actual

- `expo-doctor` pasa correctamente.
- Se agrego `expo-dev-client` en `apps/mobile`.
- `apps/mobile/eas.json` ya tiene perfiles para `development`, `preview` y `production`.
- `apps/mobile/app.json` ya declara paquete Android `com.arcadas.citofonia`.
- `apps/mobile/app.json` ya declara el permiso Android `CALL_PHONE`.
- La app ya abre llamadas del sistema Android con `tel:` para usar la SIM.
- WhatsApp se envia por backend usando WhatsApp Cloud API cuando las credenciales estan configuradas.

## Comandos principales

Desde la carpeta `apps/mobile`:

```powershell
npm.cmd run dev-client
```

Inicia Metro para una app instalada como development build.

```powershell
npm.cmd run build:android:development
```

Genera una APK de desarrollo con EAS. Esta APK sirve para instalar en un Android fisico y probar capacidades que Expo Go no soporta.

```powershell
npm.cmd run build:android:preview
```

Genera una APK interna para pruebas mas estables con cliente o porteria.

```powershell
npm.cmd run build:android:production
```

Genera un Android App Bundle (`.aab`) para Play Store.

## Flujo recomendado

1. Iniciar sesion en Expo/EAS: `npx eas login`.
2. Para prueba inicial en celular, ejecutar `npm.cmd run build:android:preview`.
3. Esperar el enlace de EAS.
4. Descargar el APK desde el enlace en el celular Android.
5. Instalar el APK. Si Android bloquea la instalacion, habilitar "instalar apps desconocidas" para el navegador usado.
6. Abrir la app instalada.
7. Iniciar sesion como `porter` o `admin`.
8. Probar busqueda de unidades, WhatsApp y llamadas.
9. Para Play Store, ejecutar `npm.cmd run build:android:production` y subir el `.aab` a Google Play Console.

## Pruebas obligatorias antes de Play Store

- Login de porteria y admin.
- Busqueda de unidades.
- Visibilidad de nombre/telefono segun configuracion web.
- WhatsApp con plantilla aprobada y ventana de 24 horas.
- Llamada desde Android con SIM activa.
- Historial de llamadas.
- Alertas y unidades bloqueadas.
- Cierre de sesion.

## Notas para Play Store

- Para Play Store se sube `.aab`, no APK.
- Para pruebas internas se puede usar APK de perfil `preview`.
- Si se mantiene `CALL_PHONE`, se debe justificar que la app es una herramienta de citofonia/porteria y necesita llamadas telefonicas operativas.
- Si Play Store rechaza permisos telefonicos, se puede retirar `CALL_PHONE` y mantener el flujo `tel:`, que abre el telefono del sistema sin llamada directa nativa.
- Las credenciales WhatsApp deben estar configuradas en el backend desplegado, no dentro de la app movil.
