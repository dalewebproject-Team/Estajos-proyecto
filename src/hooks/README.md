# `src/hooks` — Custom hooks

Hooks reutilizables que encapsulan lógica de **navegador** o **suscripción**.
Los hooks de **negocio** (cargar trabajadores, etc.) no van aquí: van como
funciones puras en `lib/api/` y las páginas las llaman.

## Inventario

| Hook              | Función |
|-------------------|---------|
| `useOnlineStatus` | Suscribe a `online`/`offline` del navegador. |
| `useQRScanner`    | Wrapper sobre `html5-qrcode` con import dinámico. |

## Cuándo crear un hook nuevo

✅ Sí:
- Encapsula un API del navegador (geolocalización, mediadevices, vibración).
- Suscribe a un canal de Supabase Realtime y limpia al desmontar.
- Wrappea una librería pesada con `import()` dinámico para code-splitting.

❌ No:
- Llama a una sola función de `lib/api/`. Para eso usa la función
  directamente desde la página.
- Maneja estado de un formulario. Usa `useState` directo.
- Es específico de una sola página. Vive como helper dentro de esa página.

## Convenciones

- Nombre siempre `useAlgo`.
- Limpiar suscripciones en el `return` del `useEffect`.
- Si el hook lanza errores, documentarlos en el JSDoc.
