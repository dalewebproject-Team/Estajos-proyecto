# `src/components` — Catálogo de componentes

Cuatro capas, de menor a mayor especificidad:

```
components/
├── layout/    Estructura macro (Header, Toggle, Nav). Una sola pieza por página.
├── ui/        Átomos visuales reutilizables sin lógica de negocio.
├── forms/     Formularios organizados por rol/dominio.
│   ├── login/      Formularios de acceso (trabajador, encargado).
│   ├── encargado/  Formularios del flujo de campo del encargado.
│   └── central/    Formularios del panel de administrador.
└── domain/    Compuestos con conocimiento del dominio (trabajadores, balances...).
```
## Reglas

1. **Una sola fuente de verdad visual**: cualquier estilo definido en la
   Guía Técnica CSS se implementa **una vez** aquí. Las páginas solo
   componen, **no estilizan**.
2. **Sin acceso a Supabase**: los componentes reciben props/handlers; jamás
   importan `lib/api/*`.
   - **Excepción — `forms/login/`**: los formularios de login sí importan
     `lib/api/*` y `store/` porque son los responsables de la llamada, el
     estado de error, el loading y la navegación post-submit.
3. **Sin estado global**: usar `useState` local; el estado compartido vive
   en `src/store`.
4. **Mobile-first**: todos asumen contenedor `max-w-md` (~400 px). Los
   tamaños de iconos, paddings y tipos están calibrados para esa anchura.

## Añadir un componente nuevo

1. Decidir la capa correcta:
   - ¿Es atómico y sin lógica? → `ui/`
   - ¿Es un formulario de acceso? → `forms/login/`
   - ¿Es un formulario del flujo del encargado? → `forms/encargado/`
   - ¿Es un formulario del panel de administrador? → `forms/central/`
   - ¿Conoce el dominio (trabajador, jornada, vehículo)? → `domain/`
   - ¿Es estructura de página? → `layout/`
2. Documentar las props con JSDoc en la cabecera.
3. Citar la sección de la Guía Técnica CSS que justifica el diseño.
4. Exportar por defecto.

## Composición típica

```jsx
<Card>                              {/* ui */}
  <SectionTitle color="green">     {/* ui */}
    Trabajadores
  </SectionTitle>
  <WorkerListItem worker={w} />    {/* domain */}
</Card>
```

## Patrón estándar — formulario con llamada a la API (`forms/login/`)

```jsx
export default function FormNombre() {
  const navigate = useNavigate()
  const setAuth  = useAuthStore((s) => s.setAuth)

  const [campo,   setCampo]   = useState('')
  const [error,   setError]   = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null); setLoading(true)
    try {
      const data = await llamadaApi(campo.trim())
      setAuth({ ... })
      navigate('/ruta')
    } catch (err) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  return (
    <Card>
      {error && <ErrorBox message={error} />}
      <form onSubmit={handleSubmit} className="space-y-4">
        ...
      </form>
    </Card>
  )
}
```

## Patrón estándar — formulario con estado interno (`forms/encargado/`, `forms/central/`)

Los formularios del encargado y del panel central no hacen llamadas a la
API directamente. Manejan su propio estado de campos y entregan un objeto
de datos al `onSubmit` que reciben como prop. La página es responsable de
la llamada y del manejo de errores.

```jsx
export default function FormNombre({ guardando, onSubmit, onCancel, submitLabel = 'GUARDAR' }) {
  const [campo, setCampo] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ campo })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input value={campo} onChange={(e) => setCampo(e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" type="button" onClick={onCancel}>CANCELAR</Button>
        <Button type="submit" variant="primary" disabled={guardando || !campo}>
          {guardando ? 'GUARDANDO…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
```

## Inventario de formularios

| Archivo | Carpeta | Patrón |
|---|---|---|
| `FormLoginTrabajador.jsx` | `forms/login/` | Llama a la API, maneja error/loading propio |
| `FormRegistroTrabajador.jsx` | `forms/login/` | Llama a la API, maneja error/loading propio |
| `FormLoginEncargado.jsx` | `forms/login/` | Llama a la API, maneja error/loading propio |
| `FormJornada.jsx` | `forms/encargado/` | Estado interno, entrega objeto al onSubmit |
| `EntradaManual.jsx` | `forms/encargado/` | Estado interno, entrega string al onSubmit |
| `FormTrabajador.jsx` | `forms/central/` | Estado interno, entrega objeto al onSubmit |
| `FormVehiculo.jsx` | `forms/central/` | Estado interno, entrega objeto al onSubmit |
| `FormGastoVehiculo.jsx` | `forms/central/` | Estado interno, entrega objeto al onSubmit |
| `FormAdelanto.jsx` | `forms/central/` | Estado interno, entrega valor al onSubmit |