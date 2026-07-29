# `components/domain` — Componentes con dominio

Compuestos que **saben de negocio** (trabajadores, balances, vehículos…).
Combinan átomos de `ui/` con datos específicos del modelo.

## Inventario

| Componente        | Usa                                     | Conoce del dominio |
|-------------------|-----------------------------------------|--------------------|
| `BalanceCard`     | gradiente navy + lógica de color verde/gris según balance | concepto "saldo pendiente" |
| `WorkerListItem`  | `CircleIcon`, `Badge`                   | shape `{id, nombre, telefono, paymentPeriod, balance}` |
| `StatCard`        | atomic, pero específico de KPIs         | colores por significado (peligro/éxito) |

## Reglas

1. Reciben **datos**, no las consultan: la página o el hook llama al
   backend y pasa props.
2. Pueden depender de `components/ui/*` y de `utils/*` (formatters).
3. **No** importan `lib/api/*`. Si un componente necesita refrescar datos,
   se le pasa `onRefresh` como prop.
4. **No** llaman a `navigate(...)`. Si necesitan navegar, se les pasa
   `onClick` desde la página padre.

## Añadir un componente nuevo

1. Confirmar que la pieza aparece (o aparecerá) en ≥ 2 páginas.
2. Definir su `shape` (los datos que espera).
3. Documentar con JSDoc.
4. Si necesita datos que no están en el shape estándar, crear primero un
   **selector** en `utils/` que los derive — no inflar el componente.
