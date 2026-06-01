# Plan de trabajo - App de citofonia Android

## Decision principal

La app se construira primero solo para Android, pensada para celulares propios del conjunto residencial. El objetivo inicial es citofonia: llamadas, chat tipo WhatsApp, historial, control de acceso a la app y proteccion de datos de residentes.

## Arquitectura elegida

1. App movil Android
   - React Native como base.
   - Expo al inicio para prototipar pantallas y flujos.
   - Expo Dev Client o React Native nativo cuando necesitemos modo kiosco, inicio automatico y llamadas dentro de la app.

2. Backend
   - Next.js desplegado en Vercel.
   - APIs para residentes, apartamentos, usuarios, permisos, auditoria, llamadas y mensajes.
   - Webhooks para WhatsApp Business Cloud API.

3. Base de datos
   - Neon PostgreSQL.
   - Guardara residentes, unidades, contactos, roles, historial de llamadas, historial de mensajes y eventos de auditoria.

4. Chat WhatsApp dentro de la app
   - No se usara la app normal de WhatsApp del celular.
   - Se usara WhatsApp Business Cloud API.
   - El portero escribira desde nuestra app.
   - El residente recibira y respondera desde WhatsApp.
   - El historial se guardara en Neon y se vera dentro de nuestra app.

5. Llamadas
   - Fase inicial: evaluar llamada con SIM desde Android.
   - Para no salir de la app, se necesitara desarrollo nativo Android y probablemente rol de dialer predeterminado.
   - Alternativa profesional futura: VoIP o central telefonica para mayor privacidad y control.

6. Bloqueo del celular
   - Usar modo kiosco en Android.
   - La app debera iniciar al encender el celular.
   - El portero no deberia poder navegar libremente por el dispositivo.
   - Esto requiere configuracion de dispositivo administrado o MDM en una etapa posterior.

## Orden definitivo de trabajo

1. Preparar entorno local
   - Instalar Node.js LTS.
   - Instalar VS Code.
   - Instalar Git.
   - Instalar Android Studio.
   - Configurar emulador Android o conectar celular Android fisico.

2. Documentar con OpenSpec
   - Definir alcance del MVP.
   - Crear especificaciones para login, residentes, llamadas, chat, roles y auditoria.
   - Validar cambios antes de programar.

3. Crear backend
   - Crear proyecto Next.js.
   - Conectar Neon PostgreSQL.
   - Crear primeras tablas.
   - Crear APIs internas.

4. Crear app movil
   - Crear proyecto Expo/React Native.
   - Crear pantallas iniciales: login, busqueda de unidad, detalle anonimo, llamar, chat e historial.
   - Conectar la app al backend local.

5. Integrar WhatsApp Business
   - Crear cuenta Meta Business.
   - Configurar WhatsApp Cloud API.
   - Crear endpoint webhook en Vercel.
   - Guardar y mostrar mensajes en Neon.

6. Llamadas Android
   - Prototipo inicial de llamada.
   - Evaluar si el nivel de control con SIM cumple.
   - Si se requiere llamada realmente interna, migrar a modulo nativo Android o VoIP.

7. Modo kiosco
   - Probar en dispositivo Android dedicado.
   - Configurar inicio automatico.
   - Bloquear salida de la app.

8. Pruebas piloto
   - Probar con pocos apartamentos.
   - Validar privacidad, velocidad y facilidad de uso.
   - Ajustar antes de cargar todo el conjunto.

## Comandos OpenSpec

OpenSpec quedo instalado como:

```powershell
openspec --version
```

Si PowerShell bloquea `openspec.ps1`, usar:

```powershell
openspec.cmd --version
```

Comandos utiles:

```powershell
openspec list
openspec list --specs
openspec validate --all --no-interactive
openspec init --tools codex --force
```

## Nota para VS Code

Despues de instalar Node.js y OpenSpec, reiniciar VS Code para que la terminal detecte los nuevos comandos.

