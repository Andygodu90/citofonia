# Bloques de trabajo principales

Este archivo organiza el proyecto por bloques completos de proceso. La idea es trabajar por segmentos funcionales grandes, no por tareas pequenas aisladas.

## Estado general actual

Fecha de corte:
2 de junio de 2026.

Estado del proyecto:
La aplicacion esta lista para piloto funcional local. Se puede probar desde un celular Android con Expo Go, conectado al backend local y a la base de datos Neon.

Ya esta implementado:
- App movil de porteria.
- Login por roles.
- Busqueda protegida de unidades.
- Registro de visitantes.
- Autorizaciones pendientes.
- Aprobacion y rechazo.
- Registro de entrada y salida.
- Historial operativo en acordeon.
- Registro manual de llamadas con trazabilidad.
- Chat tipo WhatsApp dentro de la app.
- Envio de mensajes por texto o plantilla WhatsApp desde la app.
- Webhook WhatsApp en backend.
- App basica de residente.
- Panel administrativo web.
- Gestion de unidades, residentes y usuarios.
- Reportes y auditoria.
- Carga masiva de residentes por CSV.
- Validaciones y confirmaciones antes de acciones sensibles.
- Health check avanzado.
- Smoke test funcional.
- Configuracion base para EAS Build Android.
- Documentacion de piloto, despliegue y WhatsApp.

Bloqueos reales que no dependen solo de codigo:
- Rotar el token de WhatsApp que fue compartido por chat.
- Crear o aprobar plantilla en Meta para iniciar conversaciones.
- Desplegar backend en Vercel para tener webhook publico.
- Configurar webhook en Meta usando la URL publica.
- Generar build Android propia para modo kiosco real.
- Decidir estrategia de llamadas reales dentro de la app: SIM nativa/dialer o VoIP.

Prioridad actual:
Pasar de piloto local a piloto controlado real.

Avance iniciado en pasos 1 al 5:
- Variables de entorno ampliadas para plantilla WhatsApp y URL publica.
- Script `npm run check:pilot` creado para revisar preparacion de piloto.
- Health check ampliado con plantilla y URL publica.
- Scripts EAS agregados para build Android preview/production.
- Documentos `14-avance-pasos-1-5.md` y `15-decision-llamadas-reales.md` creados.

## Bloque 1 - Base del sistema y entorno

Objetivo:
Dejar el proyecto estable, versionado, documentado y ejecutable en local.

Incluye:
- Estructura de carpetas del proyecto.
- App movil Android con Expo.
- Backend con Next.js.
- Base de datos Neon.
- Repositorio GitHub.
- Variables de entorno.
- Documentacion Markdown.
- Scripts para inicializar y verificar base de datos.
- OpenSpec y docs actualizados.

Criterio de finalizacion:
- El proyecto corre localmente.
- El backend responde.
- La app abre en Expo Go.
- La base de datos responde.
- El codigo esta versionado en GitHub.

Estado:
Completado para piloto local.

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
Avanzado para piloto. Antes de produccion se deben rotar credenciales expuestas y endurecer politica de contrasenas.

## Bloque 3 - Unidades, residentes y contactos protegidos

Objetivo:
Gestionar la estructura residencial y proteger los datos personales de los residentes.

Incluye:
- Conjunto Residencial Arcadas de San Isidro.
- Bloques 31 al 45.
- 5 pisos por bloque.
- 4 apartamentos por piso: A, B, C y D.
- 300 unidades.
- Residentes asociados a unidades.
- Contactos telefonicos y WhatsApp.
- Busqueda por bloque, apartamento o combinacion.
- Informacion protegida en porteria.
- Datos reales guardados solo en backend/base de datos.

Criterio de finalizacion:
- Porteria puede buscar unidades rapidamente.
- Al seleccionar una unidad se oculta la lista completa.
- La app muestra solo datos operativos protegidos.
- Los contactos reales permanecen protegidos.

Estado:
Completado para piloto.

## Bloque 4 - Citofonia, llamadas y comunicacion inicial

Objetivo:
Permitir que porteria contacte residentes y registre la trazabilidad de cada intento.

Incluye:
- Registrar intentos de llamada.
- Asociar llamada a unidad, contacto y usuario de porteria.
- Guardar estado de llamada: iniciada, contestada, no contestada, rechazada.
- Historial de llamadas.
- Mensajes internos.
- Estructura para WhatsApp Business Cloud API.
- Preparacion para llamadas por SIM o alternativa VoIP.
- Auditoria de llamadas y mensajes.
- Privacidad de numeros.

Criterio de finalizacion:
- Cada llamada o mensaje queda registrado.
- El historial muestra eventos de comunicacion.
- El flujo esta listo para integracion real de WhatsApp y llamadas.

Estado:
Avanzado. El registro y trazabilidad estan listos. La llamada real dentro de la app depende de una decision tecnica: SIM nativa/dialer o VoIP.

## Bloque 5 - Registro de visitantes

Objetivo:
Permitir que porteria registre visitantes y deje una solicitud de ingreso pendiente.

Incluye:
- Formulario de visitante en app movil.
- Nombre, documento, telefono, tipo y motivo.
- Unidad visitada.
- Registro en tabla de visitantes.
- Creacion de autorizacion pendiente.
- Creacion de evento de acceso pendiente.
- Auditoria del registro.
- Validaciones basicas.
- Confirmacion antes de registrar.

Criterio de finalizacion:
- Porteria puede registrar visitante desde una unidad seleccionada.
- El visitante queda asociado a una unidad.
- Se crea una autorizacion pendiente.
- Se crea un evento de acceso pendiente.

Estado:
Completado para piloto.

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
- Mostrar panel como acordeon.
- Confirmaciones antes de aprobar o rechazar.
- Preparar aprobacion por residente via WhatsApp o app residente.

Criterio de finalizacion:
- Porteria puede ver pendientes.
- Porteria puede aprobar o rechazar.
- El estado cambia correctamente en la base de datos.
- El historial refleja la accion.

Estado:
Completado para piloto.

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
- Vista general de turno.
- Base para filtros futuros por unidad, visitante, fecha y estado.

Criterio de finalizacion:
- Porteria puede abrir/cerrar historial.
- El historial carga eventos recientes.
- No ocupa pantalla todo el tiempo.
- Refleja acciones recientes de llamadas, mensajes, visitantes e ingresos.

Estado:
Completado para piloto. Pendiente futuro: filtros avanzados y exportacion.

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
- Consultar movimientos del dia.
- Auditar cada cambio de estado.
- Confirmaciones antes de entrada o salida.

Criterio de finalizacion:
- Cada visita tiene estado claro.
- Se puede saber quien ingreso, a que unidad, a que hora y si ya salio.
- Porteria puede consultar ingresos abiertos.

Estado:
Completado para piloto.

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
- Configuracion inicial del conjunto.
- Carga masiva desde CSV.
- Desactivar residentes o unidades.
- Control de permisos por rol.

Criterio de finalizacion:
- Administracion puede mantener datos sin tocar la base manualmente.
- Porteria no puede acceder a funciones administrativas.
- Se pueden cargar residentes de forma masiva.

Estado:
Avanzado para piloto. Pendiente futuro: mejorar UI del panel admin y soportar importacion Excel directa.

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
Avanzado para piloto. Pendiente futuro: exportar CSV/PDF y filtros mas completos.

## Bloque 11 - WhatsApp Business Cloud API

Objetivo:
Integrar comunicacion real con residentes sin abrir WhatsApp normal en el celular de porteria.

Incluye:
- Configurar Meta Business.
- Configurar WhatsApp Cloud API.
- Crear webhook en backend.
- Enviar mensajes desde backend.
- Enviar texto o plantilla desde app movil.
- Recibir respuestas de residentes.
- Guardar conversaciones en Neon.
- Mostrar chat dentro de la app.
- Asociar mensajes a unidad, residente, visitante y autorizacion.
- Manejar plantillas de WhatsApp.
- Controlar errores de entrega.

Criterio de finalizacion:
- Porteria envia mensajes desde la app.
- Residentes responden por WhatsApp.
- La conversacion se ve dentro de la app.
- El celador no abre WhatsApp normal.

Estado:
Avanzado tecnicamente. Para prueba real faltan pasos externos: rotar token, aprobar plantilla, desplegar backend en Vercel y configurar webhook publico en Meta.

## Bloque 12 - Modo kiosco Android y dispositivo dedicado

Objetivo:
Convertir el celular de porteria en una terminal dedicada para la app.

Incluye:
- Salir de Expo Go hacia build propia.
- Configuracion base EAS Build.
- Crear APK interno.
- Evaluar Lock Task Mode.
- Configurar inicio automatico.
- Restringir salida de la app.
- Crear mecanismo administrativo para desbloqueo.
- Documentar instalacion en equipos de porteria.

Criterio de finalizacion:
- El celular puede operar como dispositivo dedicado.
- El celador no puede usar libremente otras apps durante el turno.
- Solo administradores pueden salir del modo restringido.

Estado:
Preparado en configuracion y documentacion. Requiere build Android propia y pruebas sobre dispositivo fisico.

## Bloque 13 - Llamadas reales con SIM o alternativa VoIP

Objetivo:
Definir e implementar la comunicacion telefonica real sin perder trazabilidad.

Incluye:
- Evaluar llamadas por SIM desde Android.
- Evaluar limitaciones de no salir de la app.
- Evaluar app como dialer predeterminado.
- Evaluar VoIP/SIP/PBX.
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
Avanzado en estrategia y trazabilidad. Requiere decision final: SIM nativa/dialer o VoIP.

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
Base funcional implementada. Pendiente futuro: notificaciones, recuperacion de contrasena, comunicados y autorizaciones temporales avanzadas.

## Bloque 15 - Calidad, pruebas y preparacion para produccion

Objetivo:
Hacer que el sistema sea confiable, mantenible y seguro.

Incluye:
- Pruebas de endpoints.
- Smoke test.
- Pruebas de flujos moviles.
- Validaciones de formularios.
- Confirmaciones antes de acciones importantes.
- Manejo de errores.
- Estados de carga.
- Seguridad de variables.
- Rotacion de credenciales filtradas.
- Revision de permisos.
- Health check avanzado.
- Preparacion de despliegue en Vercel.
- Preparacion de builds Android.

Criterio de finalizacion:
- El sistema se puede probar de forma repetible.
- Hay menos riesgo de errores en operacion real.
- Esta listo para piloto controlado.

Estado:
Avanzado para piloto. Pendiente produccion: rotacion de credenciales, despliegue publico, pruebas con usuarios reales y build Android propia.

## Ruta recomendada siguiente

### Paso 1 - Cierre de seguridad de credenciales

Objetivo:
Evitar que el piloto real use tokens expuestos o inseguros.

Tareas:
- Rotar el token de WhatsApp en Meta.
- Actualizar `WHATSAPP_ACCESS_TOKEN` en local y Vercel.
- Mantener `WHATSAPP_PHONE_NUMBER_ID`.
- Mantener `WHATSAPP_VERIFY_TOKEN` en local, Vercel y Meta.
- Verificar `/api/health`.
- Ejecutar `npm run check:pilot`.

Resultado esperado:
El backend queda configurado con credenciales nuevas y seguras.

Estado:
Iniciado. El proyecto ya tiene script de verificacion; falta rotacion real en Meta.

### Paso 2 - Despliegue del backend en Vercel

Objetivo:
Crear URL publica para API, panel admin y webhook WhatsApp.

Tareas:
- Crear proyecto en Vercel conectado a GitHub.
- Usar root directory `apps/api`.
- Configurar variables de entorno.
- Ejecutar build en Vercel.
- Abrir `/api/health`.
- Abrir `/admin`.
- Definir `APP_PUBLIC_BASE_URL` con el dominio real.

Resultado esperado:
El backend funciona fuera del computador local.

Estado:
Preparado. Falta crear el proyecto y copiar variables en Vercel.

### Paso 3 - Configurar WhatsApp real

Objetivo:
Permitir mensajes reales y respuestas desde WhatsApp.

Tareas:
- Crear plantilla `solicitud_autorizacion_ingreso` en Meta.
- Aprobar plantilla.
- Configurar webhook de Meta con URL de Vercel.
- Probar verificacion del webhook.
- Enviar plantilla desde la app.
- Responder desde WhatsApp del residente.
- Cargar historial en la app.
- Confirmar que la plantilla configurada en `.env` coincide con Meta.

Resultado esperado:
Porteria usa chat interno y el residente responde desde WhatsApp.

Estado:
Preparado tecnicamente. Falta aprobacion de plantilla y webhook publico.

### Paso 4 - Preparar build Android propia

Objetivo:
Salir de Expo Go para acercarnos a modo kiosco y funciones Android reales.

Tareas:
- Instalar/iniciar sesion en EAS.
- Ejecutar build preview APK.
- Instalar APK en el celular de porteria.
- Validar login, busqueda, registro, autorizaciones, chat e historial.
- Documentar problemas encontrados.
- Usar `npm run build:android:preview`.

Resultado esperado:
La app funciona instalada como APK propia.

Estado:
Preparado. Falta login EAS y generar APK.

### Paso 5 - Definir estrategia de llamadas reales

Objetivo:
Resolver si la llamada debe hacerse con SIM nativa o VoIP.

Opciones:
- SIM/dialer: mas cercana al celular, pero puede requerir permisos nativos y posiblemente salir al dialer.
- VoIP/SIP/PBX: mas profesional para llamada dentro de la app, mejor trazabilidad y privacidad, pero requiere proveedor o central.

Decision recomendada:
Para cumplir "sin salirse de la app", evaluar VoIP como ruta principal. Mantener SIM como alternativa si se acepta abrir el dialer o usar app dialer predeterminada.

Estado:
Documentado. Recomendacion tecnica: VoIP/SIP/PBX como ruta principal; SIM solo como alternativa si se acepta dialer o modulo nativo.

### Paso 6 - Piloto controlado en porteria

Objetivo:
Probar el sistema en condiciones reales con pocos apartamentos.

Tareas:
- Elegir 5 a 10 unidades reales.
- Cargar residentes reales por CSV.
- Confirmar telefonos WhatsApp.
- Probar ingreso, salida, rechazo, historial y reporte.
- Medir errores y tiempos.
- Recoger comentarios del celador/portero.

Resultado esperado:
Lista de ajustes reales antes de ampliar a las 300 unidades.

### Paso 7 - Mejoras de produccion

Objetivo:
Preparar la app para uso estable y crecimiento.

Tareas:
- Recuperacion de contrasena.
- Mejoras visuales del panel admin.
- Exportacion de reportes.
- Notificaciones para residentes.
- Comunicados administrativos.
- Permisos mas detallados por rol.
- Logs operativos mas completos.
- Plan de respaldo y mantenimiento de base de datos.

Resultado esperado:
Sistema listo para evolucionar de citofonia MVP a plataforma residencial.
