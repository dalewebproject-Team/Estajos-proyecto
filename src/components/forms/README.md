# `src/components/forms` — Formularios de la aplicación

Formularios organizados por rol. Cada subcarpeta agrupa los formularios
que pertenecen al mismo contexto funcional.

## Estructura

forms/
├── login/
│   ├── FormLoginTrabajador.jsx    → Acceso de trabajador con teléfono
│   ├── FormRegistroTrabajador.jsx → Registro de nuevo trabajador
│   └── FormLoginEncargado.jsx     → Acceso de encargado con teléfono + PIN
└── encargado/
│   ├── FormJornada.jsx            → Registro de horas, destajo
│   ├── EntradaManual.jsx          → Entrada manual de UUID cuando el QR falla
│   └── FormPlazas.jsx             → Registro de las plazas de la furgoneta
└── central/
│   ├── FormAdelanto.jsx           → Registro de los adelantos de los empleados
│   ├── FormGastoVehiculo.jsx      → Registro de los adelantos del vehiculo
│   ├── FormTrabajador.jsx         → Registro de nuevos empleados
│   └── FormVehiculo.jsx           → Registro de nuevos vehiculos

## Dos patrones, una regla

Existen dos tipos de formulario según quién es responsable de la llamada
a la API:

| Patrón | Carpeta | Responsabilidad |
|---|---|---|
| **Autónomo** | `login/` | El formulario llama a `lib/api/*`, maneja su propio `error` y `loading`, y navega post-submit. |
| **Controlado** | `encargado/` | El formulario maneja solo el estado de sus campos. La página recibe los datos via `onSubmit({ ... })` y es responsable de la llamada y los errores. |

## Cuándo usar cada patrón

**Autónomo** (`login/`) cuando:
- El formulario tiene una única acción clara (login, registro).
- El resultado siempre navega a la misma ruta.
- No necesita coordinarse con otros formularios en la misma página.

**Controlado** (`encargado/`) cuando:
- El mismo formulario se reutiliza para distintas acciones
  (ej: `FormJornada` sirve tanto para trabajadores escaneados como
  para el auto-registro del encargado).
- La página necesita controlar qué pasa después del submit
  (cambiar de modo, limpiar estado, etc.).
- El manejo de errores es responsabilidad de la página.

## Reglas generales

1. **Sin acceso directo a Supabase** en formularios controlados — solo
   en autónomos.
2. **Sin estado global** — usar `useState` local para los campos.
3. **Documentar siempre las props** con JSDoc en la cabecera del archivo.
4. **Exportar por defecto**.
5. **Un formulario por archivo** — si un formulario crece demasiado,
   extraer sub-componentes dentro de la misma carpeta.

## Añadir un formulario nuevo

1. Decidir el patrón (¿autónomo o controlado?).
2. Crear el archivo en la subcarpeta correcta.
3. Documentar las props con JSDoc.
4. Añadirlo al inventario del README de `src/components/`.

## Ejemplo — formulario autónomo

```jsx
export default function FormLoginTrabajador() {
  const navigate = useNavigate()
  const setAuth  = useAuthStore((s) => s.setAuth)

  const [telefono, setTelefono] = useState('')
  const [error,    setError]    = useState(null)
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null); setLoading(true)
    try {
      const t = await loginTrabajador(telefono.trim())
      setAuth({ rol: 'trabajador', userId: t.id, nombre: t.nombre })
      navigate('/trabajador/qr')
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

## Ejemplo — formulario controlado

```jsx
export default function FormJornada({ guardando, onSubmit, onCancel, submitLabel = 'REGISTRAR' }) {
  const [horas,   setHoras]   = useState('')
  const [destajo, setDestajo] = useState('')
  const [plazas,  setPlazas]  = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ horas, destajo, plazas })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      ...
    </form>
  )
}
```