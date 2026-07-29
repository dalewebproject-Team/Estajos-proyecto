# `pages/central` — Panel del Administrador

Único rol con email + contraseña (Supabase Auth). Acceso **sin restricciones**
en producción salvo lo que limite la RLS del JWT.

## Navegación

Cinco pestañas con scroll horizontal (`HorizontalNav`):

| Ruta                            | Página                  | Función |
|---------------------------------|-------------------------|---------|
| `/central/escanear`             | EscanearPage            | Escanear QR de un trabajador → ver perfil + adelantar/pagar |
| `/central/reporte`              | ReporteDiarioPage       | Vista del día: jornadas, plazas, vehículos |
| `/central/resumen`              | ResumenPage             | KPIs globales (totales, por pagar, adelantos) |
| `/central/trabajadores`         | TrabajadoresPage        | Listado + CRUD de empleados |
| `/central/trabajadores/:id`     | TrabajadorDetallePage   | Perfil completo + edición + historial + adelanto |
| `/central/vehiculos`            | VehiculosPage           | Listado + CRUD de furgonetas + PIN del día |

## Patrón visual

Todas las páginas del Central comparten:

```jsx
<Header rightLabel="Salir" ... />
<HorizontalNav />            {/* sólo aquí */}
<div className="px-4 pt-4 pb-6 max-w-md mx-auto space-y-4">
  <Card> ... </Card>
</div>
```

## Formularios

Las páginas de este panel no contienen formularios directamente. Todos
están extraídos a `src/components/forms/central/` siguiendo el patrón
**controlado**: la página maneja la llamada a la API y los errores; el
formulario solo gestiona el estado de sus campos.

| Página | Formulario usado | Dónde |
|---|---|---|
| `TrabajadoresPage` | `FormTrabajador` (modo crear) | Modal interno |
| `TrabajadorDetallePage` | `FormTrabajador` (modo editar) | Sección inline |
| `TrabajadorDetallePage` | `FormAdelanto` (compact) | Sección inline |
| `EscanearPage` | `FormAdelanto` | Modal interno |
| `VehiculosPage` | `FormVehiculo` | Modal interno |
| `VehiculosPage` | `FormGastoVehiculo` | Modal interno |

## Realtime

El panel debe suscribirse a la tabla `jornadas` con `supabase.channel(...)`
para reflejar registros nuevos del Encargado en tiempo real:

```js
supabase
  .channel('jornadas-live')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'jornadas' },
      (payload) => { /* actualizar UI */ })
  .subscribe()
```

(Activar Realtime para `jornadas` en Supabase Dashboard → Database → Replication.)