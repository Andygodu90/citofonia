# Git y GitHub

## Estado

Git y GitHub CLI quedaron instalados.

Despues de reiniciar VS Code, estos comandos deberian funcionar:

```powershell
git --version
gh --version
```

## Iniciar sesion en GitHub

Ejecutar:

```powershell
gh auth login
```

Seleccionar:

- GitHub.com
- HTTPS
- Login with a web browser

GitHub CLI mostrara un codigo. Debes abrir el navegador, iniciar sesion y autorizar.

## Crear repositorio desde este proyecto

Desde la carpeta del proyecto:

```powershell
git init
git add .
git commit -m "Inicializa proyecto de citofonia Android"
gh repo create citofonia-android --private --source=. --remote=origin --push
```

Si prefieres que el repositorio sea publico, cambiar `--private` por `--public`.

## Nombre sugerido

`citofonia-android`

