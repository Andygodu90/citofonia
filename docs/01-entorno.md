# Entorno de desarrollo

## Herramientas instaladas

- Node.js LTS: instalado.
- OpenSpec: instalado.
- Git: instalado.
- GitHub CLI: instalado.
- Vercel CLI: instalado.
- EAS CLI: instalado.
- Visual Studio Code: instalado.

## Herramientas pendientes

- Android Studio.
- Android SDK.
- ADB.

Android Studio es necesario cuando pasemos a builds nativos, modo kiosco, inicio automatico y funcionalidades Android profundas. Se intento instalar con `winget`, pero no finalizo dentro del tiempo disponible. Para pantallas iniciales podemos avanzar usando Expo Go en un celular Android.

## Nota importante en PowerShell

PowerShell puede bloquear archivos `.ps1`. Si un comando falla por politica de ejecucion, usa el wrapper `.cmd`.

Ejemplos:

```powershell
npm.cmd -v
openspec.cmd --version
vercel.cmd --version
eas.cmd --version
```

## Comandos utiles

```powershell
node -v
npm.cmd -v
git --version
gh --version
openspec.cmd --version
vercel.cmd --version
eas.cmd --version
```

Despues de instalar herramientas nuevas, reiniciar VS Code para refrescar el PATH.

## Probar la app movil

Desde la carpeta del proyecto:

```powershell
cd apps/mobile
npm.cmd start
```

Luego instalar Expo Go en el celular Android y escanear el QR.

## Probar el backend

Desde la carpeta del proyecto:

```powershell
cd apps/api
npm.cmd run dev
```

Abrir:

```text
http://localhost:3000
http://localhost:3000/api/health
```
