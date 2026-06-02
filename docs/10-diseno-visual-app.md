# Diseno visual de la app movil

## Objetivo

La app movil debe sentirse como una herramienta residencial profesional, cercana a plataformas como Munily, pero enfocada inicialmente en citofonia, porteria y privacidad de datos.

## Decision actual

Se instalo React Native Paper como libreria visual base para mejorar la apariencia sin abandonar Expo Go. La app conserva `StyleSheet` para composicion propia, pero ahora usa componentes de Paper en zonas clave:

- `PaperProvider`
- Tema Material Design 3 personalizado.
- `Card` para cabecera principal.
- `Button` para acciones principales.
- `TextInput` para campos destacados.
- `Chip` para estados/perfiles.
- Interfaz de chat tipo WhatsApp con cabecera, burbujas, hora y barra de escritura.
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
- Chat con burbujas verdes para mensajes salientes y blancas para mensajes entrantes.

## Librerias candidatas para una siguiente fase

### React Native Paper

Opcion elegida para esta fase. Componentes listos:

- Botones.
- Text inputs.
- Dialogos.
- Tabs.
- App bars.
- Theme provider.

Ventaja: acelera UI consistente y se integra bien con Expo.

Riesgo: hay que ajustar estilos propios para que no parezca una app generica.

### NativeWind

Buena opcion si queremos usar clases tipo Tailwind en React Native.

Ventaja: facilita velocidad de maquetacion y consistencia.

Riesgo: requiere configuracion adicional de Babel/Tailwind y puede agregar complejidad para alguien que esta empezando.

## Recomendacion

Mantener React Native Paper + sistema visual interno. Cuando la app este mas estable, podemos migrar componentes repetidos a una carpeta como:

```text
apps/mobile/src/ui/
```

Y luego decidir si vale la pena instalar React Native Paper o NativeWind.
