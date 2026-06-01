# Bloques de trabajo principales

Este archivo organiza el proyecto por bloques completos de proceso. La idea es trabajar por segmentos funcionales grandes, no por tareas pequeñas aisladas.

## Bloque 1 - Base del sistema y entorno

Objetivo:
Dejar el proyecto estable, versionado, documentado y ejecutable en local.

Incluye:
- Preparar estructura de carpetas del proyecto.
- Configurar app movil Android con Expo.
- Configurar backend con Next.js.
- Configurar base de datos Neon.
- Crear repositorio GitHub.
- Configurar variables de entorno.
- Crear documentacion Markdown.
- Crear scripts para inicializar y verificar base de datos.
- Mantener OpenSpec y docs actualizados.

Criterio de finalizacion:
- El proyecto corre localmente.
- El backend responde.
- La app abre en Expo Go.
- La base de datos responde.
- El codigo esta versionado en GitHub.

Estado:
Avanzado.

## Bloque 2 - Autenticacion, roles y seguridad base

Objetivo:
Crear un sistema minimo pero solido para controlar quien entra y que puede hacer.

Incluye:
- Login de usuarios.
- Usuario de porteria.
- Roles iniciales: superadmin, admin, porter, resident.
- Tokens de sesion.
- Proteccion de endpoints privados.
- Registro de ultimo acceso.
- Bloqueo por intentos fallidos.
- Cierre de sesion en app movil.
- Manejo de usuarios activos e inactivos.
- Auditoria de inicio de sesion.
- Preparacion para permisos por modulo.

Criterio de finalizacion:
- Ningun endpoint operativo de porteria funciona sin token.
- El usuario de porteria puede iniciar sesion.
- La app bloquea el flujo operativo si no hay sesion.
- Las acciones sensibles quedan auditadas.

Estado:
Parcialmente avanzado.

## Bloque 3 - Unidades, residentes y contactos protegidos

Objetivo:
Gestionar la estructura residencial y proteger los datos personales de los residentes.

Incluye:
- Crear conjunto residencial.
- Crear bloques, pisos y apartamentos.
- Crear residentes asociados a unidades.
- Crear contactos telefonicos y WhatsApp.
- Buscar unidades por bloque, apartamento o combinacion.
- Mostrar informacion protegida en porteria.
- Evitar exponer nombres completos y telefonos al celador.
- Crear endpoints para detalle de unidad.
- Crear vista movil de busqueda y seleccion de unidad.
- Ajustar experiencia cuando se selecciona una unidad.

Criterio de finalizacion:
- Porteria puede buscar unidades rapidamente.
- Al seleccionar una unidad se oculta la lista completa.
- La app muestra solo datos operativos protegidos.
- Los contactos reales permanecen en backend/base de datos.

Estado:
Avanzado.

## Bloque 4 - Citofonia, llamadas y comunicacion inicial

Objetivo:
Permitir que porteria contacte residentes y registre la trazabilidad de cada intento.

Incluye:
- Registrar intentos de llamada.
- Asociar llamada a unidad, contacto y usuario de porteria.
- Guardar estado de llamada: iniciada, contestada, no contestada, rechazada.
- Crear historial de llamadas.
- Crear mensajes internos de prueba.
- Preparar estructura para WhatsApp Business Cloud API.
- Preparar estructura para llamadas por SIM o alternativa VoIP.
- Auditar llamadas y mensajes.
- Mantener datos sensibles protegidos.

Criterio de finalizacion:
- Cada llamada o mensaje queda registrado.
- El historial muestra eventos de comunicacion.
- El flujo esta listo para integrar WhatsApp Business en una fase posterior.

Estado:
Parcialmente avanzado.

## Bloque 5 - Registro de visitantes

Objetivo:
Permitir que porteria registre visitantes y deje una solicitud de ingreso pendiente.

Incluye:
- Formulario de visitante en app movil.
- Nombre del visitante.
- Documento.
- Telefono.
- Tipo de visitante.
- Motivo de visita.
- Unidad visitada.
- Registro en tabla de visitantes.
- Creacion de autorizacion pendiente.
- Creacion de evento de acceso pendiente.
- Auditoria del registro.
- Validaciones basicas de campos.

Criterio de finalizacion:
- Porteria puede registrar visitante desde una unidad seleccionada.
- El visitante queda asociado a una unidad.
- Se crea una autorizacion pendiente.
- Se crea un evento de acceso pendiente.

Estado:
Avanzado.

## Bloque 6 - Autorizaciones e ingresos pendientes

Objetivo:
Gestionar solicitudes de ingreso pendientes y permitir aprobar o rechazar.

Incluye:
- Listar ingresos pendientes.
- Mostrar visitante, unidad, tipo y estado.
- Aprobar ingreso.
- Rechazar ingreso.
- Actualizar estado en autorizacion.
- Actualizar estado en evento de acceso.
- Registrar auditoria de aprobacion o rechazo.
- Mostrar panel como acordeon para no saturar pantalla.
- Actualizar historial despues de cada decision.
- Preparar futura aprobacion por residente via WhatsApp o app residente.

Criterio de finalizacion:
- Porteria puede ver pendientes.
- Porteria puede aprobar o rechazar.
- El estado cambia correctamente en la base de datos.
- El historial refleja la accion.

Estado:
Avanzado.

## Bloque 7 - Historial operativo de porteria

Objetivo:
Dar trazabilidad visible al usuario de porteria sin saturar la pantalla principal.

Incluye:
- Historial reciente como acordeon.
- Ultimos visitantes registrados.
- Ultimas llamadas.
- Ultimos mensajes internos.
- Estados de cada evento.
- Fecha/hora de cada evento.
- Filtros futuros por unidad, visitante, fecha y estado.
- Vista por unidad.
- Vista general de turno.
- Exportacion futura para administracion.

Criterio de finalizacion:
- Porteria puede abrir/cerrar historial.
- El historial carga eventos recientes.
- No ocupa pantalla todo el tiempo.
- Refleja acciones recientes de llamadas, mensajes, visitantes e ingresos.

Estado:
Parcialmente avanzado.

## Bloque 8 - Flujo completo de ingreso y salida

Objetivo:
Completar el ciclo real del control de acceso: solicitud, aprobacion, ingreso y salida.

Incluye:
- Marcar ingreso efectivo despues de aprobacion.
- Registrar hora de entrada.
- Registrar salida.
- Registrar hora de salida.
- Identificar ingresos pendientes de salida.
- Evitar registrar salida sin ingreso.
- Manejar visitantes rechazados.
- Manejar visitantes que nunca ingresaron.
- Consultar movimientos del dia.
- Auditar cada cambio de estado.

Criterio de finalizacion:
- Cada visita tiene estado claro.
- Se puede saber quien ingreso, a que unidad, a que hora y si ya salio.
- Porteria puede consultar ingresos abiertos.

Estado:
Pendiente.

## Bloque 9 - Panel administrativo web

Objetivo:
Crear una interfaz de administracion para gestionar datos del conjunto.

Incluye:
- Login de administrador.
- Gestion de unidades.
- Gestion de residentes.
- Gestion de contactos.
- Gestion de usuarios de porteria.
- Consulta de visitantes.
- Consulta de reportes.
- Configuracion del conjunto.
- Carga masiva futura desde Excel/CSV.
- Desactivar residentes o unidades.
- Control de permisos por rol.

Criterio de finalizacion:
- Administracion puede mantener datos sin tocar la base manualmente.
- Porteria no puede acceder a funciones administrativas.

Estado:
Pendiente.

## Bloque 10 - Reportes y auditoria

Objetivo:
Permitir consulta de actividad, trazabilidad y control administrativo.

Incluye:
- Reporte de visitantes por fecha.
- Reporte por unidad.
- Reporte por bloque.
- Reporte por celador.
- Visitantes aprobados.
- Visitantes rechazados.
- Ingresos pendientes de salida.
- Llamadas realizadas.
- Mensajes enviados.
- Auditoria de acciones sensibles.
- Filtros por fecha, estado, usuario y unidad.

Criterio de finalizacion:
- Administracion puede revisar actividad historica.
- Los eventos criticos tienen trazabilidad.
- Los reportes ayudan a operar y auditar el conjunto.

Estado:
Pendiente.

## Bloque 11 - WhatsApp Business Cloud API

Objetivo:
Integrar comunicacion real con residentes sin abrir WhatsApp normal en el celular de porteria.

Incluye:
- Configurar Meta Business.
- Configurar WhatsApp Cloud API.
- Crear webhook en backend.
- Enviar mensajes desde backend.
- Recibir respuestas de residentes.
- Guardar conversaciones en Neon.
- Mostrar chat dentro de la app.
- Asociar mensajes a unidad, residente, visitante y autorizacion.
- Manejar plantillas de WhatsApp si aplica.
- Controlar errores de entrega.

Criterio de finalizacion:
- Porteria envia mensajes desde la app.
- Residentes responden por WhatsApp.
- La conversacion se ve dentro de la app.
- El celador no abre WhatsApp normal.

Estado:
Pendiente.

## Bloque 12 - Modo kiosco Android y dispositivo dedicado

Objetivo:
Convertir el celular de porteria en una terminal dedicada para la app.

Incluye:
- Evaluar salida de Expo Go hacia build propio.
- Crear build Android con EAS o React Native nativo.
- Configurar inicio automatico.
- Evaluar Lock Task Mode.
- Restringir salida de la app.
- Registrar intentos de salida.
- Crear mecanismo administrativo para desbloqueo.
- Revisar configuracion de dispositivo administrado.
- Documentar instalacion en equipos de porteria.

Criterio de finalizacion:
- El celular puede operar como dispositivo dedicado.
- El celador no puede usar libremente otras apps durante el turno.
- Solo administradores pueden salir del modo restringido.

Estado:
Pendiente.

## Bloque 13 - Llamadas reales con SIM o alternativa VoIP

Objetivo:
Definir e implementar la comunicacion telefonica real sin perder trazabilidad.

Incluye:
- Evaluar llamadas por SIM desde Android.
- Evaluar limitaciones de no salir de la app.
- Evaluar app dialer predeterminada.
- Evaluar VoIP o central telefonica.
- Registrar estados reales de llamada.
- Registrar duracion.
- Asociar llamada a visitante y autorizacion.
- Mantener privacidad de numeros.
- Definir arquitectura final de llamadas.

Criterio de finalizacion:
- Existe una estrategia clara para llamadas reales.
- La solucion cumple el nivel de privacidad requerido.
- Cada llamada queda registrada en historial.

Estado:
Pendiente.

## Bloque 14 - App de residentes

Objetivo:
Crear funcionalidades para residentes en una fase posterior.

Incluye:
- Login de residente.
- Ver visitantes pendientes.
- Aprobar o rechazar ingreso.
- Crear visitantes frecuentes.
- Crear autorizaciones temporales.
- Ver historial de visitas de su unidad.
- Recibir notificaciones.
- Ver comunicados de administracion.
- Actualizar datos permitidos.

Criterio de finalizacion:
- Residente puede gestionar autorizaciones de su unidad.
- Porteria recibe decisiones del residente.
- El control de acceso ya no depende solo de llamada manual.

Estado:
Futuro.

## Bloque 15 - Calidad, pruebas y preparacion para produccion

Objetivo:
Hacer que el sistema sea confiable, mantenible y seguro.

Incluye:
- Pruebas de endpoints.
- Pruebas de flujos moviles.
- Validaciones de formularios.
- Manejo de errores.
- Estados de carga.
- Seguridad de variables.
- Rotacion de credenciales filtradas.
- Revision de permisos.
- Logs.
- Preparacion de despliegue en Vercel.
- Preparacion de builds Android.

Criterio de finalizacion:
- El sistema se puede probar de forma repetible.
- Hay menos riesgo de errores en operacion real.
- Esta listo para piloto controlado.

Estado:
Continuo.

## Orden sugerido de trabajo

1. Bloque 8 - Flujo completo de ingreso y salida.
2. Bloque 7 - Mejorar historial con filtros por unidad y estado.
3. Bloque 9 - Panel administrativo web.
4. Bloque 10 - Reportes y auditoria.
5. Bloque 11 - WhatsApp Business Cloud API.
6. Bloque 12 - Modo kiosco Android.
7. Bloque 13 - Llamadas reales.
8. Bloque 14 - App de residentes.
9. Bloque 15 - Calidad y produccion.
