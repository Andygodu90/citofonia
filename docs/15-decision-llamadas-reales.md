# Decision tecnica de llamadas reales

Objetivo:
Definir la ruta mas viable para hacer llamadas sin exponer numeros y sin perder trazabilidad.

## Requisito principal

La porteria debe poder contactar residentes sin visualizar nombres completos ni numeros. Idealmente la llamada no debe sacar al usuario de la app.

## Opcion A - SIM nativa / dialer Android

Ventajas:
- Usa la SIM del celular.
- Puede ser mas economico al inicio.
- No requiere proveedor VoIP.

Limitaciones:
- Expo Go no sirve para esto.
- Normalmente Android abre el dialer o pantalla del sistema.
- Para mayor control se requiere build nativa.
- Podria requerir que la app sea dialer predeterminado.
- La experiencia "sin salirse de la app" no esta garantizada.

Uso recomendado:
Solo si el conjunto acepta que la llamada pueda pasar por una interfaz Android externa o si se decide invertir en modulo nativo.

## Opcion B - VoIP / SIP / PBX

Ventajas:
- Mejor opcion para llamada dentro de la app.
- Mayor control de estados, duracion y trazabilidad.
- El numero real del residente puede permanecer oculto.
- Puede integrarse con grabacion, extensiones o central telefonica.
- Escala mejor si luego se quiere plataforma residencial mas completa.

Limitaciones:
- Requiere proveedor o central.
- Puede tener costo mensual.
- Requiere pruebas de calidad de red.
- Puede requerir SDK o integracion adicional.

Uso recomendado:
Ruta principal si el requisito "sin salir de la app" es obligatorio.

## Opcion C - Mantener registro manual temporal

Ventajas:
- Ya esta implementado.
- Permite piloto inmediato.
- Mantiene trazabilidad minima.
- No bloquea WhatsApp ni control de acceso.

Limitaciones:
- No hace llamada real por si sola.
- Depende de accion manual del portero/celador.
- No registra duracion real.

Uso recomendado:
Mantener durante piloto controlado mientras se decide VoIP o SIM.

## Decision recomendada

Para el piloto:
- Mantener registro manual de llamadas.
- Usar WhatsApp Business como canal principal de autorizacion.
- Medir si realmente se necesita llamada telefonica dentro de la app.

Para produccion:
- Elegir VoIP/SIP/PBX si el conjunto exige llamada dentro de la app.
- Evaluar SIM nativa solo si se acepta una experiencia Android menos controlada.

## Proximo paso tecnico si se elige VoIP

1. Seleccionar proveedor.
2. Confirmar si ofrece SDK React Native o SIP estandar.
3. Crear prueba de llamada en APK preview.
4. Registrar inicio, contestacion, fin y duracion.
5. Integrar historial con `call_logs`.

## Proximo paso tecnico si se elige SIM

1. Crear build Android propia.
2. Ejecutar `expo prebuild`.
3. Revisar permisos Android.
4. Probar intent de llamada.
5. Evaluar app como dialer predeterminado.
6. Medir si se expone el numero o se abre UI externa.
