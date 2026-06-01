Quiero crear desde cero una APP de citofonía y control de acceso para conjuntos residenciales, edificios, condominios o propiedades privadas. La aplicación debe estar pensada para ser usada principalmente por el personal de portería/celaduría, administradores y residentes, permitiendo gestionar llamadas, visitantes, residentes, autorizaciones, historial de ingresos y seguridad general del acceso.

La APP debe tener una estructura clara, profesional, segura, escalable y fácil de usar. No se debe asumir ninguna herramienta, lenguaje, framework o tecnología específica. El objetivo es definir completamente qué debe hacer la aplicación, cómo debe organizarse y qué tareas deben desarrollarse para construirla desde cero.

## 1. Objetivo general de la APP

Crear una aplicación de citofonía moderna que permita:

* Registrar y consultar residentes.
* Gestionar visitantes.
* Permitir llamadas o comunicación entre portería y residentes.
* Registrar entradas y salidas.
* Controlar autorizaciones de ingreso.
* Llevar historial de eventos de seguridad.
* Administrar usuarios y permisos.
* Usar un celular o dispositivo móvil como terminal exclusiva para visualizar y operar únicamente esta APP, evitando el acceso a otras aplicaciones del dispositivo.

## 2. Tipos de usuarios

La APP debe contemplar los siguientes roles:

### 2.1. Superadministrador

Usuario principal del sistema. Debe poder:

* Crear, editar, activar o desactivar administradores.
* Crear y gestionar conjuntos, edificios o propiedades.
* Ver estadísticas globales.
* Configurar parámetros generales del sistema.
* Auditar registros de actividad.
* Gestionar permisos generales.

### 2.2. Administrador

Usuario encargado de la administración de una propiedad específica. Debe poder:

* Gestionar residentes.
* Gestionar apartamentos, torres, casas o unidades.
* Crear usuarios celadores.
* Consultar historial de visitantes.
* Revisar reportes.
* Configurar reglas internas de acceso.
* Ver registros de llamadas y novedades.

### 2.3. Celador / Portería

Usuario operativo de la APP. Debe poder:

* Buscar residentes rápidamente.
* Registrar visitantes.
* Contactar al residente.
* Validar autorización de ingreso.
* Registrar entrada y salida.
* Ver información básica del residente.
* Crear novedades o reportes de seguridad.
* Usar la APP en modo restringido, sin poder salir a otras aplicaciones del celular.

### 2.4. Residente

Usuario propietario o habitante de una unidad residencial. Debe poder:

* Autorizar o rechazar visitantes.
* Registrar visitantes frecuentes.
* Consultar historial de visitas a su unidad.
* Actualizar datos básicos autorizados.
* Recibir notificaciones o alertas.
* Ver comunicados de administración.

## 3. Módulos principales de la APP

### 3.1. Módulo de autenticación

La APP debe tener un sistema seguro de acceso para cada tipo de usuario.

Debe incluir:

* Inicio de sesión.
* Cierre de sesión.
* Recuperación de contraseña.
* Cambio obligatorio de contraseña inicial.
* Control de usuarios activos e inactivos.
* Bloqueo por intentos fallidos.
* Validación de permisos según rol.
* Registro de último acceso.

### 3.2. Panel principal

Cada usuario debe ver un panel adaptado a su rol.

El panel debe mostrar:

* Accesos rápidos.
* Resumen de visitas del día.
* Alertas pendientes.
* Últimos registros.
* Estado general de la operación.
* Botones principales según el tipo de usuario.

### 3.3. Módulo de residentes

Debe permitir administrar toda la información de residentes.

Campos sugeridos:

* Torre, bloque o edificio.
* Apartamento, casa o unidad.
* Nombre del titular.
* Documento.
* Teléfono principal.
* Teléfono secundario.
* Correo electrónico.
* Estado activo o inactivo.
* Observaciones.
* Personas autorizadas.
* Vehículos asociados.
* Mascotas, si aplica.
* Contacto de emergencia.

Funciones:

* Crear residente.
* Editar residente.
* Desactivar residente.
* Buscar por nombre, torre, apartamento, teléfono o documento.
* Ver historial de visitas.
* Asociar varios habitantes a una unidad.
* Marcar residentes con restricciones o notas especiales.

### 3.4. Módulo de visitantes

Debe permitir registrar, consultar y controlar visitantes.

Campos sugeridos:

* Nombre del visitante.
* Documento.
* Teléfono.
* Foto, si aplica.
* Motivo de visita.
* Unidad a visitar.
* Residente visitado.
* Fecha y hora de llegada.
* Fecha y hora de salida.
* Estado de la visita.
* Autorización del residente.
* Observaciones del celador.
* Tipo de visitante: familiar, domiciliario, proveedor, técnico, empleado, conductor, invitado u otro.

Funciones:

* Registrar visitante.
* Buscar visitante existente.
* Reutilizar datos de visitantes frecuentes.
* Solicitar autorización al residente.
* Marcar ingreso aprobado, rechazado o pendiente.
* Registrar salida.
* Consultar historial por visitante, residente, fecha o unidad.
* Generar alertas por visitantes restringidos.

### 3.5. Módulo de citofonía / comunicación

La APP debe permitir que portería contacte al residente de forma rápida.

Debe contemplar:

* Búsqueda rápida de residente.
* Botón de llamada o contacto.
* Registro automático del intento de comunicación.
* Estado de la llamada: contestada, no contestada, rechazada o pendiente.
* Observaciones del celador.
* Relación entre llamada, visitante y unidad.
* Historial de comunicaciones.
* Opción de confirmar autorización después de la comunicación.

La APP debe permitir integrarse con el sistema de llamadas del celular cuando sea necesario, especialmente si se usa una SIM para contactar residentes. La estructura debe considerar que cada llamada realizada desde portería quede registrada dentro del historial del sistema.

### 3.6. Módulo de autorizaciones

Debe permitir controlar quién puede ingresar y bajo qué condiciones.

Tipos de autorización:

* Autorización inmediata.
* Autorización previa.
* Visitante frecuente.
* Autorización temporal.
* Autorización por fecha.
* Autorización por rango horario.
* Autorización denegada.
* Lista negra o restricción especial.

Funciones:

* Crear autorización.
* Editar autorización.
* Cancelar autorización.
* Validar autorización al momento del ingreso.
* Notificar al residente.
* Registrar quién autorizó.
* Guardar fecha, hora y usuario que realizó la acción.

### 3.7. Módulo de ingresos y salidas

Debe registrar todos los movimientos.

Debe incluir:

* Entrada de visitantes.
* Salida de visitantes.
* Entrada de proveedores.
* Salida de proveedores.
* Entrada de empleados.
* Salida de empleados.
* Registro manual de novedades.
* Filtros por fecha, unidad, visitante, tipo de ingreso y celador.

Cada registro debe guardar:

* Fecha y hora.
* Usuario que registró.
* Persona que ingresó.
* Unidad visitada.
* Estado de autorización.
* Observaciones.
* Evidencia, si aplica.

### 3.8. Módulo de novedades

Debe permitir que el celador o administrador registre eventos importantes.

Ejemplos de novedades:

* Visitante sospechoso.
* Paquete recibido.
* Daño en zona común.
* Incidente de seguridad.
* Vehículo mal parqueado.
* Residente no contesta.
* Intento de ingreso no autorizado.
* Observación general de turno.

Cada novedad debe incluir:

* Tipo de novedad.
* Descripción.
* Fecha y hora.
* Usuario que reporta.
* Evidencia, si aplica.
* Estado: abierta, revisada, cerrada.
* Comentarios administrativos.

### 3.9. Módulo de reportes

Debe permitir consultar información de operación.

Reportes sugeridos:

* Visitas por día.
* Visitas por residente.
* Visitas por torre o unidad.
* Visitantes frecuentes.
* Visitantes rechazados.
* Llamadas realizadas.
* Autorizaciones aprobadas.
* Autorizaciones rechazadas.
* Novedades por fecha.
* Actividad por celador.
* Ingresos y salidas pendientes.

Los reportes deben poder filtrarse por:

* Fecha inicial.
* Fecha final.
* Tipo de visitante.
* Estado.
* Torre.
* Apartamento.
* Usuario.
* Residente.

### 3.10. Módulo de administración

Debe permitir configurar la propiedad.

Configuraciones sugeridas:

* Nombre del conjunto o edificio.
* Logo.
* Datos de contacto.
* Torres, bloques o zonas.
* Apartamentos o unidades.
* Reglas de ingreso.
* Usuarios del sistema.
* Roles y permisos.
* Horarios permitidos.
* Estados personalizados.
* Motivos de visita.
* Tipos de visitantes.

### 3.11. Módulo de seguridad y auditoría

La APP debe registrar acciones importantes para trazabilidad.

Debe guardar:

* Usuario que realizó la acción.
* Fecha y hora.
* Tipo de acción.
* Módulo afectado.
* Registro afectado.
* Datos anteriores y nuevos cuando aplique.
* Dirección o identificación del dispositivo cuando sea necesario.

Acciones auditables:

* Inicio de sesión.
* Cierre de sesión.
* Creación de usuarios.
* Cambios en residentes.
* Registro de visitantes.
* Aprobaciones o rechazos.
* Eliminaciones o desactivaciones.
* Cambios de configuración.
* Intentos fallidos de acceso.

## 4. Modo celular restringido / dispositivo exclusivo

La APP debe contemplar una opción para que el celular usado en portería funcione como dispositivo exclusivo de la aplicación.

Este modo debe permitir:

* Que el usuario solo pueda ver y usar la APP.
* Bloquear o impedir el acceso a otras aplicaciones del celular.
* Evitar que el celador navegue fuera de la APP durante el turno.
* Mantener la APP siempre visible o como pantalla principal.
* Solicitar autorización administrativa para salir del modo restringido.
* Registrar intentos de salida o desbloqueo.
* Permitir que solo usuarios autorizados puedan desactivar este modo.
* Mostrar una interfaz simple, segura y enfocada en la operación de portería.

Este modo debe ser pensado para un celular dedicado exclusivamente a la citofonía y control de acceso.

## 5. Estructura general de pantallas

La APP debe contar como mínimo con las siguientes pantallas:

1. Pantalla de inicio de sesión.
2. Pantalla de recuperación de contraseña.
3. Panel principal según rol.
4. Buscador rápido de residentes.
5. Perfil del residente.
6. Registro de visitante.
7. Validación de autorización.
8. Registro de entrada.
9. Registro de salida.
10. Historial de visitas.
11. Historial de llamadas.
12. Novedades.
13. Reportes.
14. Administración de usuarios.
15. Administración de residentes.
16. Configuración de propiedad.
17. Configuración de modo restringido del celular.
18. Perfil de usuario.
19. Pantalla de permisos denegados.
20. Pantalla de error o sin conexión.

## 6. Reglas generales de experiencia de usuario

La APP debe ser:

* Muy fácil de usar para celadores.
* Rápida en búsquedas.
* Clara en botones de acción.
* Con textos grandes y legibles.
* Optimizada para celular.
* Con diseño limpio y profesional.
* Con colores que diferencien estados: aprobado, rechazado, pendiente, alerta.
* Con confirmaciones antes de acciones importantes.
* Con mensajes claros de error.
* Con navegación simple.
* Con acceso rápido a las funciones más usadas.

## 7. Estados principales del sistema

La APP debe manejar estados como:

* Activo.
* Inactivo.
* Pendiente.
* Aprobado.
* Rechazado.
* En espera.
* Ingresó.
* Salió.
* Vencido.
* Bloqueado.
* Autorizado.
* No autorizado.
* Revisado.
* Cerrado.

## 8. Reglas de seguridad

La APP debe cumplir con las siguientes reglas:

* Cada usuario debe tener permisos según su rol.
* Un celador no debe poder acceder a funciones administrativas.
* Un residente solo debe ver información relacionada con su unidad.
* Las contraseñas deben manejarse de forma segura.
* Las acciones críticas deben quedar registradas.
* Los usuarios inactivos no pueden iniciar sesión.
* Se deben bloquear accesos sospechosos.
* No se debe permitir borrar información importante sin trazabilidad.
* Los registros históricos deben conservarse.
* Las sesiones deben expirar cuando sea necesario.
* El modo celular restringido solo debe poder ser desactivado por usuarios autorizados.

## 9. Tareas para construir la APP desde cero

### Fase 1: Definición inicial

1. Definir el alcance completo de la APP.
2. Definir roles y permisos.
3. Definir módulos principales.
4. Definir flujos de usuario.
5. Definir estructura de datos.
6. Definir estados del sistema.
7. Definir reglas de seguridad.
8. Definir pantallas iniciales.
9. Definir flujo de citofonía.
10. Definir flujo de ingreso y salida.

### Fase 2: Diseño funcional

1. Diseñar el flujo de inicio de sesión.
2. Diseñar el panel por tipo de usuario.
3. Diseñar el buscador de residentes.
4. Diseñar el formulario de visitantes.
5. Diseñar el proceso de autorización.
6. Diseñar el historial de visitas.
7. Diseñar el módulo de llamadas.
8. Diseñar el módulo de novedades.
9. Diseñar el módulo de reportes.
10. Diseñar la configuración del modo celular restringido.

### Fase 3: Base estructural de la APP

1. Crear estructura general del proyecto.
2. Crear estructura de navegación.
3. Crear estructura de autenticación.
4. Crear estructura de roles.
5. Crear estructura de permisos.
6. Crear estructura de almacenamiento de datos.
7. Crear estructura de validaciones.
8. Crear estructura de auditoría.
9. Crear estructura de reportes.
10. Crear estructura de configuración.

### Fase 4: Desarrollo de módulos

1. Crear módulo de usuarios.
2. Crear módulo de residentes.
3. Crear módulo de visitantes.
4. Crear módulo de autorizaciones.
5. Crear módulo de llamadas.
6. Crear módulo de ingresos.
7. Crear módulo de salidas.
8. Crear módulo de novedades.
9. Crear módulo de reportes.
10. Crear módulo de configuración.
11. Crear módulo de modo celular restringido.

### Fase 5: Validaciones

1. Validar campos obligatorios.
2. Validar formatos de documento, teléfono y correo.
3. Validar usuarios activos.
4. Validar permisos por rol.
5. Validar autorizaciones vencidas.
6. Validar visitantes restringidos.
7. Validar duplicados.
8. Validar sesiones.
9. Validar registros incompletos.
10. Validar acciones críticas.

### Fase 6: Seguridad

1. Implementar control de acceso por rol.
2. Proteger rutas o pantallas privadas.
3. Registrar actividad de usuarios.
4. Bloquear intentos fallidos.
5. Controlar sesiones activas.
6. Evitar acceso no autorizado.
7. Proteger datos sensibles.
8. Registrar cambios importantes.
9. Crear respaldo lógico de información.
10. Proteger la salida del modo celular restringido.

### Fase 7: Pruebas

1. Probar inicio de sesión.
2. Probar creación de usuarios.
3. Probar creación de residentes.
4. Probar búsqueda de residentes.
5. Probar registro de visitantes.
6. Probar autorización de ingreso.
7. Probar rechazo de ingreso.
8. Probar registro de salida.
9. Probar historial de visitas.
10. Probar historial de llamadas.
11. Probar novedades.
12. Probar reportes.
13. Probar permisos por rol.
14. Probar modo celular restringido.
15. Probar errores y casos límite.

### Fase 8: Optimización

1. Mejorar velocidad de carga.
2. Optimizar búsquedas.
3. Mejorar navegación móvil.
4. Reducir pasos innecesarios.
5. Mejorar mensajes de error.
6. Mejorar interfaz para celadores.
7. Optimizar historial y reportes.
8. Mejorar seguridad de sesión.
9. Optimizar funcionamiento en dispositivos de portería.
10. Preparar la APP para crecimiento futuro.

## 10. Resultado esperado

Al finalizar, la APP debe permitir que una portería pueda operar digitalmente el control de acceso y la citofonía de una propiedad, registrando visitantes, contactando residentes, autorizando ingresos, controlando salidas, generando reportes y manteniendo trazabilidad completa.

La aplicación debe ser segura, rápida, clara y pensada para uso diario en portería. Además, debe incluir una opción de celular restringido para que el dispositivo usado por el celador solo permita visualizar y operar la APP, sin acceso a otras aplicaciones.