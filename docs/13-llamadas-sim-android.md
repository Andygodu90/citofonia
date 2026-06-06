# Llamadas por SIM en Android

Este proyecto ya conecta el flujo de llamadas de porteria con Android. Al iniciar una llamada, el backend registra la trazabilidad, obtiene el contacto habilitado y la app abre la llamada del sistema usando la SIM del telefono.

## Estado actual

- El backend registra la llamada en `call_logs`.
- El endpoint `POST /api/porter/units/:id/calls` devuelve el numero real solo a la app autenticada.
- La app movil no muestra el numero real en pantalla.
- En Android instalado, la app usa `tel:` para abrir la llamada con la SIM del equipo.
- En web, solo registra la llamada y muestra que la prueba real debe hacerse en Android.
- `apps/mobile/app.json` declara el permiso `CALL_PHONE`, dejando la base preparada para evolucionar a llamada nativa directa.

## Limitacion importante

Con una llamada por SIM, Android controla la pantalla telefonica. La app puede mantener el numero oculto dentro de su interfaz, pero el sistema telefonico puede mostrar informacion propia del marcador o llamada.

Para iniciar una llamada sin pasar por el marcador se necesita un modulo nativo Android con `Intent.ACTION_CALL` y el permiso `CALL_PHONE`. Esa opcion requiere build propia y pruebas en Android fisico; no funciona en Expo Go.

## Flujo de prueba

1. Instalar una build propia de Android.
2. Iniciar sesion como `porter` o `admin`.
3. Entrar a `Llamadas`.
4. Buscar una unidad con contacto habilitado.
5. Presionar la unidad o la opcion de llamada.
6. Confirmar que Android abre la llamada usando la SIM.
7. Volver a la app y finalizar el registro desde la pantalla de llamada.

## Pendiente avanzado

- Crear modulo nativo para `ACTION_CALL` si se requiere llamada directa sin marcador.
- Evaluar modo kiosco Android para bloquear navegacion fuera de la app.
- Para llamadas entrantes o perdidas reales, evaluar permisos telefonicos adicionales. Esto puede tener restricciones fuertes de Play Store.
