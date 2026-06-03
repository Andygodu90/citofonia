# Visualizacion web, computador e iPhone

## Objetivo

Permitir revisar la app movil sin depender de un telefono Android ni de Expo Go.

La app de React Native ahora tambien puede abrirse como aplicacion web usando Expo Web. Esto permite probar los flujos principales desde:

- Computador.
- iPhone o iPad usando Safari.
- Cualquier celular conectado a la misma red Wi-Fi.

## Que se puede probar

Desde navegador se puede probar:

- Login de porteria, administrador y residente.
- Busqueda protegida de unidades.
- Registro de visitantes.
- Autorizaciones pendientes.
- Registro de entrada y salida.
- Historial operativo.
- Chat interno tipo WhatsApp.
- Envio hacia backend de mensajes normales o plantilla WhatsApp.
- Panel administrativo web desde el backend.

## Que no se puede probar desde navegador

Estas partes siguen requiriendo Android real o una build propia:

- Modo kiosco Android.
- Inicio automatico al encender el celular.
- Restriccion para impedir uso normal del dispositivo.
- Permisos nativos de llamadas.
- Llamada real por SIM dentro del flujo Android.

La version web sirve para avanzar visualmente y validar flujos, pero no reemplaza las pruebas finales de dispositivo Android dedicado.

## Comandos para iniciar

Abrir una terminal para el backend:

```bash
cd apps/api
npm run dev
```

Abrir otra terminal para la app web:

```bash
cd apps/mobile
npm run web:lan
```

## URLs de prueba

En el mismo computador:

```text
http://localhost:8082
```

Desde iPhone, iPad u otro celular en la misma red Wi-Fi:

```text
http://192.168.80.27:8082
```

Panel administrativo web:

```text
http://192.168.80.27:3000/admin
```

API backend:

```text
http://192.168.80.27:3000
```

## Configuracion de URL dentro de la app

La URL de la API ya no se muestra en la pantalla de inicio de sesion. Queda configurada internamente para evitar que porteria tenga que cambiarla manualmente.

Cuando se abre desde navegador, la app completa automaticamente la URL de la API con el mismo host:

```text
http://HOST_DEL_NAVEGADOR:3000
```

Ejemplos:

- Si abres `http://localhost:8082`, usara `http://localhost:3000`.
- Si abres `http://192.168.80.27:8082`, usara `http://192.168.80.27:3000`.

Cuando se abra como app nativa Android, usara por defecto:

```text
http://192.168.80.27:3000
```

Si la IP del computador cambia, se debe actualizar la IP fija en `apps/mobile/App.tsx` o configurar una URL publica cuando el backend este desplegado.

## Usuarios de prueba

Porteria:

```text
usuario: porteria
clave: Porteria123*
```

Administrador:

```text
usuario: admin
clave: Admin123*
```

Residente:

```text
usuario: residente
clave: Residente123*
```

## Requisitos para probar desde iPhone

- El computador y el iPhone deben estar en la misma red Wi-Fi.
- El backend debe estar corriendo en el puerto `3000`.
- La app web debe estar corriendo en el puerto `8082`.
- Si Windows Firewall pregunta, permitir acceso a Node.js en red privada.
- Si cambia la IP del computador, se debe usar la nueva IP en la URL.

## Nota tecnica

El backend permite CORS para la app web local y para la red LAN en el puerto `8082`. Esto es necesario porque el navegador bloquea llamadas entre puertos distintos si la API no lo autoriza.
