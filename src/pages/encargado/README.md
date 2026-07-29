# `pages/encargado` — Flujo del Encargado

El Encargado es un trabajador con permiso temporal. Su flujo es **lineal y
obligatorio**:

```
EncargadoPinPage          → /encargado
       │  (PIN 4 dígitos validado por Edge Function)
       ▼
SeleccionVehiculoPage     → /encargado/vehiculo
       │  (elegir furgo + introducir PIN del vehículo)
       ▼
EscanearTrabajadorPage    → /encargado/controlEncargado
       │  (escanear QR → registrar jornada)
       ▼
   (loop hasta cerrar sesión)
```

## Regla crítica de orden

> **El encargado DEBE ingresar su PIN ANTES de poder seleccionar el vehículo.**

No se puede saltar pasos. Si se accede directamente a `/encargado/controlEncargado`
sin haber pasado por los pasos previos, el guard de auth debe redirigir a
`/encargado`.

## Restricciones de UI

- Nunca mostrar tarifas, salarios ni adelantos al encargado.
- Mostrar el aviso visible: *"El salario acumulado no se muestra al encargado"*
  (componente ya implementado en `EscanearTrabajadorPage`).
- Sus propias horas se registran automáticamente al validar su PIN; no hace
  falta que se auto-escanee.

## Modo offline

Las jornadas se encolan en IndexedDB vía `src/lib/offline.js` si no hay red,
y se sincronizan al reconectar. Mostrar siempre el contador de pendientes
mediante `countPending()` y un banner cuando `useOnlineStatus() === false`.
