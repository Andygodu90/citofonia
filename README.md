# Citofonia residencial Android

Proyecto para construir una app Android de citofonia y control de acceso para un conjunto residencial.

La primera version se enfocara en el puesto de porteria:

- Buscar unidades residenciales sin exponer nombres ni telefonos.
- Iniciar llamadas desde la app.
- Manejar chat tipo WhatsApp dentro de la app usando WhatsApp Business Cloud API.
- Guardar historial de mensajes, llamadas y auditoria.
- Preparar el camino para modo kiosco en dispositivos Android propios.

## Carpetas principales

```text
apps/
  mobile/   App Android en React Native / Expo
  api/      Backend Next.js para Vercel
docs/       Documentacion del proyecto
openspec/   Especificaciones y cambios formales
outputs/    Entregables generados
work/       Archivos temporales de trabajo
```

## Documentacion

Empieza por:

- [docs/00-indice.md](docs/00-indice.md)
- [docs/01-entorno.md](docs/01-entorno.md)
- [docs/02-arquitectura.md](docs/02-arquitectura.md)
- [docs/03-neon.md](docs/03-neon.md)
- [docs/04-github.md](docs/04-github.md)
- [docs/06-flujo-porteria-mvp.md](docs/06-flujo-porteria-mvp.md)
