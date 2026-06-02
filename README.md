# Citofonia residencial Android

Proyecto para construir una app Android de citofonia y control de acceso para un conjunto residencial.

La primera version se enfocara en el puesto de porteria:

- Buscar unidades residenciales sin exponer nombres ni telefonos.
- Iniciar sesion como usuario de porteria.
- Registrar visitantes con autorizacion pendiente.
- Aprobar o rechazar ingresos pendientes.
- Registrar entrada y salida de visitantes.
- Consultar historial reciente de porteria.
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
- [docs/07-panel-admin-web.md](docs/07-panel-admin-web.md)
- [docs/08-whatsapp-kiosco-llamadas.md](docs/08-whatsapp-kiosco-llamadas.md)
- [docs/09-app-residentes-y-produccion.md](docs/09-app-residentes-y-produccion.md)
- [docs/10-diseno-visual-app.md](docs/10-diseno-visual-app.md)
- [docs/11-carga-masiva-residentes.md](docs/11-carga-masiva-residentes.md)
- [docs/12-checklist-piloto.md](docs/12-checklist-piloto.md)
- [docs/13-despliegue-vercel-whatsapp.md](docs/13-despliegue-vercel-whatsapp.md)
