# `src/store` — Estado global con Zustand

Estado **mínimo** que sobrevive entre páginas: sesión, preferencias,
selecciones de flujo (vehículo activo del encargado…).

## Inventario

| Store          | Persiste a localStorage | Contenido |
|----------------|-------------------------|-----------|
| `authStore.js` | sí (excepto `vehiculoActivoId`) | `{ rol, userId, nombre, vehiculoActivoId }` |

## Reglas

1. **No duplicar datos del backend**. Si Supabase es la fuente de verdad,
   no copiar listas enteras al store — usar caché de React (`useQuery`,
   `useEffect`) o re-fetchear.
2. **Solo lo que la UI necesita en múltiples páginas**. Si un dato solo lo
   usa una página, vive en `useState` local.
3. **Persistir con cuidado**. La `partialize` del middleware controla qué
   se guarda en `localStorage`. Nunca persistir PINs, JWTs ni datos
   sensibles (Supabase ya gestiona la sesión por su lado).

## Uso típico

```jsx
import { useAuthStore } from '../store/authStore.js'

function MiPagina() {
  const rol      = useAuthStore((s) => s.rol)
  const setAuth  = useAuthStore((s) => s.setAuth)
  const clear    = useAuthStore((s) => s.clear)
  // ...
}
```

Seleccionar **solo los campos que se usan** (no `useAuthStore()` entero) →
evita renders innecesarios.

## Por qué Zustand y no Redux/Context

- Zustand es 1 KB, sin boilerplate.
- El store de esta app es pequeño (4-5 valores). Redux sería excesivo.
- Context provoca renders en cascada; Zustand permite suscribirse por
  campo.
