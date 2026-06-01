# Diseno visual de la app movil

## Objetivo

La app movil debe sentirse como una herramienta residencial profesional, cercana a plataformas como Munily, pero enfocada inicialmente en citofonia, porteria y privacidad de datos.

## Decision actual

Por ahora no se instalo una libreria visual pesada. La app sigue usando React Native puro con `StyleSheet`, pero se creo una base de diseno interna:

- Paleta centralizada.
- Cabecera de marca.
- Tarjetas tipo dashboard.
- Estados visuales para exito, error e informacion.
- Botones primarios, secundarios, de aprobacion y rechazo.
- Paneles diferenciados para porteria y residente.

Esta decision mantiene compatibilidad con Expo Go y reduce el riesgo de romper la version que ya estas probando.

## Estilo base

- Fondo claro y operativo.
- Azul profundo para identidad institucional.
- Verde/teal para acciones principales.
- Amarillo para acciones preventivas o pendientes.
- Rojo solo para rechazos o desactivaciones.
- Tarjetas con borde suave y sombra ligera.
- Textos grandes y legibles para uso en porteria.

## Librerias candidatas para una siguiente fase

### React Native Paper

Buena opcion si queremos componentes listos:

- Botones.
- Text inputs.
- Dialogos.
- Tabs.
- App bars.
- Theme provider.

Ventaja: acelera UI consistente.

Riesgo: hay que revisar compatibilidad exacta con Expo SDK 54 y ajustar estilos para que no parezca una app generica.

### NativeWind

Buena opcion si queremos usar clases tipo Tailwind en React Native.

Ventaja: facilita velocidad de maquetacion y consistencia.

Riesgo: requiere configuracion adicional de Babel/Tailwind y puede agregar complejidad para alguien que esta empezando.

## Recomendacion

Mantener el sistema visual interno hasta que validemos los flujos principales. Cuando la app este mas estable, podemos migrar componentes repetidos a una carpeta como:

```text
apps/mobile/src/ui/
```

Y luego decidir si vale la pena instalar React Native Paper o NativeWind.
