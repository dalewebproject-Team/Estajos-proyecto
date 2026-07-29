# `src/lib` — Capa de infraestructura

Aquí vive todo lo que **conecta la app con el exterior**: Supabase,
IndexedDB, futuros servicios. Los componentes y páginas **nunca** acceden
directamente a Supabase; siempre pasan por funciones de `lib/api/*`.

## Estructura

```
lib/
├── supabase.js          Cliente singleton de Supabase (importable desde toda la app)
├── offline.js           Cola local en IndexedDB para escritura offline
└── api/                 Funciones tipadas por dominio (workers, vehicles…)
```

## Reglas

1. **Una sola instancia de Supabase**. Siempre importar `{ supabase }`
   desde `lib/supabase.js`. Crear un nuevo `createClient` en otro sitio es
   un bug.
2. **Las funciones de `api/` siempre `throw`** en error (no devuelven
   `{ data, error }`). Las páginas las envuelven en try/catch y muestran
   toasts.
3. **Cero React** dentro de `lib/`. No `useState`, no JSX, no hooks. Es
   código puro reutilizable también desde tests o scripts.
4. **Tipos del backend** se asumen como en `supabase/migrations/`. Si una
   tabla cambia, actualizar también los selectores de las funciones aquí.

## Cómo extender

Para añadir un nuevo dominio (ej. `pagos`):

1. Crear `lib/api/pagos.js`.
2. Importar `{ supabase }` desde `../supabase.js`.
3. Exportar funciones puras: `listarPagos()`, `crearPago(...)`, etc.
4. Documentar con JSDoc qué tabla(s) toca y qué política RLS aplica.

## Modo offline

Cuando `useOnlineStatus() === false`, las funciones que **escriben** deben
encolar en `offline.js` en lugar de llamar a Supabase:

```js
import { queueOperation } from '../offline.js'

export async function registrarJornada(payload) {
  if (!navigator.onLine) {
    return queueOperation('registrarJornada', payload)
  }
  // ... llamada normal a Supabase
}
```

Al reconectar, llamar a `syncPendingOperations({ registrarJornada, ... })`
desde un efecto global.
