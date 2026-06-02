# Mejoras base de produccion

Objetivo:
Definir las mejoras que deben hacerse despues del piloto controlado para llevar la app a operacion estable.

## Prioridad alta

### Seguridad

- Rotar token de WhatsApp.
- Cambiar contrasenas de usuarios de prueba.
- Crear usuarios reales por persona.
- Evitar compartir usuario de porteria entre turnos si se requiere trazabilidad individual.
- Revisar usuarios inactivos cada semana.
- Mantener `.env.local` fuera de Git.

### Disponibilidad

- Desplegar backend en Vercel.
- Revisar `/api/health` despues de cada despliegue.
- Confirmar que Neon no esta pausando el proyecto durante turnos.
- Definir responsable de soporte.

### Operacion

- Cargar residentes reales por CSV validado.
- Probar flujo con 5 a 10 unidades.
- Exportar reporte CSV al final de cada turno durante piloto.
- Registrar observaciones del celador/portero.

## Prioridad media

### Panel administrativo

- Mejorar visualmente el panel admin.
- Separar vistas de unidades, residentes, usuarios, reportes y auditoria.
- Agregar exportaciones por fecha.
- Agregar busqueda avanzada por bloque/apartamento.
- Agregar resumen por turno.

### Residentes

- Recuperacion de contrasena.
- Actualizacion controlada de datos.
- Notificaciones.
- Autorizaciones temporales.
- Visitantes frecuentes.

### Reportes

- Exportar CSV ya queda iniciado.
- Agregar PDF en una fase posterior.
- Agregar filtros por usuario, bloque, visitante y rango horario.
- Mostrar duracion de llamadas cuando exista integracion real.

## Prioridad baja

- Comunicados administrativos.
- Reservas o zonas comunes.
- Pagos o cartera.
- Encuestas.
- Marketplace interno.

## Recomendacion de orden

1. Terminar piloto WhatsApp real.
2. Crear APK preview con EAS.
3. Ejecutar piloto de 5 a 10 unidades.
4. Ajustar UI segun comentarios de porteria.
5. Mejorar panel administrativo.
6. Definir VoIP o SIM nativa.
7. Preparar modo kiosco real.

## Criterio de produccion

La app puede considerarse lista para produccion inicial cuando:

- Vercel responde estable.
- Neon responde estable.
- WhatsApp tiene plantilla aprobada.
- El webhook recibe respuestas.
- Porteria completa flujo de ingreso y salida sin ayuda.
- Administracion puede exportar reportes.
- Hay al menos una prueba exitosa con APK propia.
- Existe proceso claro para soporte y cambios.
