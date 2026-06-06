# Cierre de web admin e inicio de app porteria

Fecha: 2026-06-05

## Estado aprobado de la web

La vista web administrativa queda como base lista para esta etapa del proyecto.

Rutas web organizadas:

- `/admin`: inicio del panel administrativo.
- `/admin/unidades`: gestion de unidades y bloqueos.
- `/admin/residentes`: gestion de residentes.
- `/admin/roles`: gestion de usuarios y roles.
- `/admin/mensajeria`: mensajeria tipo chat con historial.
- `/admin/reportes`: reportes.

Reglas aprobadas:

- La web siempre debe iniciar mostrando el login cuando no exista sesion activa.
- Despues de iniciar sesion, el usuario puede navegar entre rutas sin volver a iniciar sesion.
- Solo los roles `admin` y `superadmin` acceden al panel web.
- El rol `porteria` no debe acceder a la web administrativa.
- El menu de sesion activa debe cerrarse al hacer clic fuera.
- La vista web usa la paleta y fuente aprobadas:
  - Blanco `#FFFFFF`
  - Azul `#1877F2`
  - Verde `#22A06B`
  - Azul claro `#EAF4FF`
  - Verde claro `#E8F7EF`
  - Azul oscuro `#123047`
  - Fuente Poppins

## Ajustes visuales aprobados en web

- Dashboard web con tarjetas de resumen: unidades, residentes y bloqueadas.
- Modulos principales con iconografia.
- Vista de unidades con boton para ver detalle por unidad.
- Botones de bloqueo muestran estado de ejecucion: bloqueando o levantando bloqueo.
- Vista de residentes en dos columnas para escritorio.
- En residentes se elimino la opcion de activar o desactivar residentes para esta version.
- El modal de residentes conserva datos de unidad, residente, vehiculos y privacidad visible para porteria.
- La mensajeria web tiene listado de chats, filtro dentro del mismo listado y conversacion a la derecha.

## Regla de trabajo desde este punto

La web administrativa queda congelada como referencia funcional para esta etapa.

Al trabajar la app movil de porteria:

- No modificar la estructura visual ni funcional de `apps/api/src/app/admin`.
- No cambiar las rutas web administrativas ya aprobadas.
- No alterar el login web aprobado.
- Si se requiere tocar backend, hacerlo solo cuando sea necesario para que porteria funcione y validando que la web no se rompa.

## Frente siguiente: app movil de porteria

La app de porteria se trabajara en:

- `apps/mobile/App.tsx`
- `apps/mobile/package.json`
- `apps/mobile/app.json`
- Archivos auxiliares futuros dentro de `apps/mobile`, si se decide separar componentes.

Prioridad inicial para porteria:

- Revisar la experiencia actual del rol porteria.
- Mantener el estilo visual coherente con la web y el mockup aprobado.
- Mejorar flujos de busqueda de unidades, visitantes, llamadas, mensajes, paquetes y movimientos.
- Conservar integracion con el backend existente.
- No depender de cambios en la web administrativa para avanzar.
