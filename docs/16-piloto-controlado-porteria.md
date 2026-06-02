# Piloto controlado en porteria

Objetivo:
Probar la app en condiciones reales antes de cargar o activar las 300 unidades.

## Alcance recomendado

Iniciar con 5 a 10 apartamentos reales.

Criterios para escoger unidades:
- Al menos una unidad con residente disponible para responder WhatsApp.
- Al menos una unidad por bloque diferente.
- Al menos una unidad donde se pueda probar ingreso aprobado.
- Al menos una unidad donde se pueda probar ingreso rechazado.
- Al menos una unidad para probar entrada y salida completa.

## Plantilla CSV para residentes piloto

Usar esta estructura en el panel admin:

```csv
bloque,apartamento,nombre,documento,telefono,email,tipo
35,1C,Nombre Residente,123456789,3148337748,residente@example.com,resident
31,1A,Nombre Residente 2,987654321,3001112233,residente2@example.com,resident
```

Reglas:
- `bloque`: solo numero del bloque, por ejemplo `35`.
- `apartamento`: formato como `1C`, `2A`, `5D`.
- `telefono`: preferiblemente celular colombiano de 10 digitos o formato `+57`.
- `tipo`: usar `resident`, `owner` o dejar `resident`.

## Flujo de prueba diario

1. Iniciar backend.
2. Abrir app en celular.
3. Iniciar sesion como porteria.
4. Buscar unidad piloto.
5. Registrar visitante.
6. Enviar plantilla WhatsApp.
7. Aprobar o rechazar ingreso.
8. Registrar entrada.
9. Registrar salida.
10. Abrir historial.
11. Revisar reporte en panel admin.
12. Exportar CSV.

## Datos a medir

Registrar durante el piloto:
- Tiempo para buscar una unidad.
- Tiempo para registrar visitante.
- Si el residente recibio WhatsApp.
- Si el residente respondio.
- Si porteria entendio los botones.
- Si hubo errores de seleccion de unidad.
- Si el historial reflejo correctamente la operacion.
- Si el reporte CSV fue util para administracion.

## Formato de observaciones

```text
Fecha:
Turno:
Usuario porteria:
Unidad:
Visitante:
Accion probada:
Resultado:
Problema encontrado:
Sugerencia:
Prioridad:
```

## Criterio para ampliar el piloto

Ampliar a mas unidades solo si:
- La busqueda de unidades funciona sin errores.
- El registro de visitante es claro para porteria.
- Las aprobaciones/rechazos quedan en historial.
- Entrada y salida quedan auditadas.
- Administracion puede revisar reportes.
- WhatsApp real funciona con al menos una plantilla aprobada.

## Criterio para bloquear salida a produccion

No pasar a produccion si:
- El token de WhatsApp no fue rotado.
- Vercel no tiene variables correctas.
- `/api/health` no responde `ok: true`.
- El celular de porteria no puede conectarse de forma estable.
- Hay confusion operativa con aprobacion/rechazo.
- Los residentes no reciben mensajes por WhatsApp.
