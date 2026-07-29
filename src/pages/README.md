
# `src/pages` — Páginas de la aplicación

Cada archivo `.jsx` es una **ruta** registrada en `src/App.jsx`. Las páginas son
componentes de **alto nivel**: orquestan layouts, llaman al backend y
componen los componentes UI/dominio reutilizables.

## Estructura

```
pages/
├── LoginPage.jsx              → /login            (Trabajador / Encargado)
├── encargado/                 → flujo del Encargado (PIN → vehículo → escanear)
│   ├── README.md
│   └── SeccionEncargadoPage.jsx
├── empleado/                  → vista única del trabajador
│   └── TrabajadorQRPage.jsx   → /trabajador/qr
└── central/                   → panel del Admin (5 pestañas)
    ├── README.md
    ├── CentralLoginPage.jsx
    ├── EscanearPage.jsx
    ├── ReporteDiarioPage.jsx
    ├── ResumenPage.jsx
    ├── TrabajadorDetallePage.jsx
    ├── TrabajadoresPage.jsx
    └── VehiculosPage.jsx
```

## Reglas para añadir una página

1. Crear el archivo `.jsx` en la subcarpeta correcta.
2. Registrar la ruta en `src/App.jsx`.
3. Si es protegida por rol, envolverla en el guard correspondiente (cuando se
   añada el guard; ver `src/lib/api/auth.js`).
4. **No** poner lógica de negocio aquí: delegarla a `src/lib/api/*`.
5. **No** crear estilos nuevos en línea: usar componentes de `components/ui`
   y, si hace falta una variante, ampliarla allí.

## Patrón estándar de una página

```jsx
import Header        from '../components/layout/Header.jsx'
import HorizontalNav from '../components/layout/HorizontalNav.jsx'   // sólo en /central/*
import Card          from '../components/ui/Card.jsx'

export default function MiPagina() {
  return (
    <div className="min-h-screen bg-app-bg">
      <Header rightLabel="Salir" onRightClick={...} />
      {/* HorizontalNav sólo si es Central */}
      <div className="px-4 pt-4 pb-6 max-w-md mx-auto space-y-4">
        <Card> ... </Card>
      </div>
    </div>
  )
}
```

## Relación con `src/components/forms`

Las páginas **no contienen formularios directamente**. Todo formulario se
extrae a `src/components/forms/` organizado por rol/dominio. Hay dos patrones:

**Autónomo** (`forms/login/`) — el formulario llama a la API, maneja su propio
error/loading y navega post-submit. La página solo lo importa y lo compone:

```
LoginPage.jsx
├── FormLoginTrabajador.jsx    → forms/login/
├── FormRegistroTrabajador.jsx → forms/login/
└── FormLoginEncargado.jsx     → forms/login/
```

**Controlado** (`forms/encargado/`, `forms/central/`) — el formulario maneja
solo el estado de sus campos. La página (o el modal dentro de ella) recibe
los datos vía `onSubmit(...)` y es responsable de la llamada a la API,
los errores y lo que ocurre después del submit:

```
TrabajadoresPage.jsx     → ModalTrabajador usa FormTrabajador   (forms/central/)
TrabajadorDetallePage.jsx → edición usa FormTrabajador          (forms/central/)
                          → adelanto inline usa FormAdelanto     (forms/central/)
EscanearPage.jsx         → ModalAdelanto usa FormAdelanto       (forms/central/)
VehiculosPage.jsx        → ModalVehiculo usa FormVehiculo       (forms/central/)
                         → ModalGastos usa FormGastoVehiculo    (forms/central/)
SeccionEncargadoPage.jsx → usa FormJornada, EntradaManual       (forms/encargado/)
```

La regla para decidir cuándo extraer un formulario es **reutilización o
complejidad**: si el mismo bloque de inputs aparece en más de un sitio, o
si el formulario tiene suficiente lógica propia, sale de la página.

## Qué se queda en la página y qué se extrae

| Responsabilidad | Dónde vive |
|---|---|
| Fetching de datos, estado de la vista | `pages/` |
| Realtime (subscripciones Supabase) | `pages/` |
| Navegación y guards de rol | `pages/` |
| Estado de campos de un formulario | `components/forms/` |
| Llamada a la API en login/registro | `components/forms/login/` |
| Llamada a la API tras submit | `pages/` (o modal dentro de la página) |
| Lógica visual reutilizable (contadores, hooks) | `src/hooks/` |

> Todas las páginas usan `max-w-md mx-auto` para mantener el ancho móvil
> (~400 px) incluso en pantallas grandes, según la filosofía mobile-first
> definida en la **Guía Técnica CSS, sección 1**.
```
