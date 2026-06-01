# Arquitectura inicial

## Objetivo del MVP

Crear una app Android para porteria que permita contactar residentes sin mostrar nombres ni numeros directamente al celador.

## Componentes

```text
App Android
  React Native / Expo
  Interfaz de porteria
  Chat propio
  Historial
  Futuro modo kiosco

Backend
  Next.js
  Vercel
  APIs privadas
  Webhooks de WhatsApp

Base de datos
  Neon PostgreSQL
  Residentes
  Unidades
  Contactos
  Mensajes
  Llamadas
  Auditoria

Servicios externos
  WhatsApp Business Cloud API
  Telefonia Android SIM o VoIP futuro
```

## Decisiones iniciales

- Solo Android en la primera etapa.
- Usar Expo para avanzar rapido en interfaz y pruebas.
- Preparar la arquitectura para salir de Expo Go cuando necesitemos funciones nativas.
- Usar WhatsApp Business Cloud API para no abrir WhatsApp normal.
- Guardar historial propio en Neon.
- Evitar mostrar nombres completos y telefonos en la app de porteria.

## Riesgo tecnico principal

Las llamadas con SIM sin salir de la app requieren integracion nativa Android y posiblemente configurar la app como dialer predeterminado. Si esto no da suficiente control, se evaluara VoIP o una central telefonica.

