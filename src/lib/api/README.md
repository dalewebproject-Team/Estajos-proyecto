# `lib/api` — Funciones de acceso al backend

Una función = un caso de uso. Agrupadas por dominio.

## Archivos

| Archivo       | Dominio           | Tablas tocadas |
|---------------|-------------------|----------------|
| `auth.js`     | Autenticación     | `empleados` + Supabase Auth + Edge Function `verificar-pin` |
| `workers.js`  | Trabajadores      | `empleados`, RPC `calcular_balance_trabajador` |
| `vehicles.js` | Vehículos         | `vehiculos` |
| `records.js`  | Jornadas, adelantos, pagos | `jornadas`, `adelantos_empleado`, `adelantos_vehiculo`, `historial_pagos` + Edge Function `ejecutar-pago` |

## Convenciones de naming

- **Lectura**: `listarX`, `getXPorId`, `getXBy<criterio>`
- **Escritura**: `crearX`, `actualizarX(id, cambios)`, `eliminarX(id)`
- **Negocio**: verbos del dominio — `registrarJornada`, `ejecutarPago`,
  `darAdelanto`.

## Patrón estándar

```js
import { supabase } from '../supabase.js'

export async function listarTrabajadores({ periodo } = {}) {
  let q = supabase.from('empleados').select('...').order('nombre')
  if (periodo) q = q.eq('payment_period', periodo)

  const { data, error } = await q
  if (error) throw error        // ← siempre throw, no devolver el error
  return data
}
```

## Seguridad

- **Jamás** usar `service_role` en el cliente. Todas las funciones aquí
  usan la `anon_key` y dependen de **RLS** para los permisos.
- Operaciones sensibles (validar PIN, ejecutar pago atómico) van a
  **Edge Functions** en `supabase/functions/`.

## Realtime

Las suscripciones se gestionan en las páginas, no aquí. Las funciones de
`api/` son síncronas (Promise) — no devuelven canales.
