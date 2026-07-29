# `src/utils` — Utilidades puras

Funciones **puras**, sin estado, sin efectos secundarios, sin dependencias
de React. Testeables como unitarios.

## Inventario

| Archivo        | Contenido |
|----------------|-----------|
| `formatters.js` | `formatEUR`, `formatEURShort`, `formatFecha`, `formatTelefono`, `getIniciales` |
| `constants.js`  | `PAYMENT_PERIODS`, `PAYMENT_PERIOD_LABELS`, `ROLES`, `APP_CONFIG`, `Direccion` |

## Reglas

1. **Puras**. Mismo input → mismo output. Sin `Date.now()` dentro (pasarlo
   como argumento si hace falta).
2. **Sin React**. No `useState`, no JSX.
3. **Sin Supabase**. Si la función necesita datos del backend, no es una
   utilidad: va a `lib/api/`.
4. **Una responsabilidad por archivo**. Si `formatters.js` crece mucho,
   dividir en `formatters/currency.js`, `formatters/dates.js`, etc.

## Referencia — `formatters.js`

| Función | Ejemplo de entrada | Ejemplo de salida |
|---|---|---|
| `formatEUR(value)` | `1250` | `"1.250,00 €"` |
| `formatEURShort(value)` | `1250.5` | `"1.251 €"` |
| `formatFecha(input)` | `'2026-05-27'` | `"27 may 2026"` |
| `formatTelefono(tel)` | `'612345678'` | `"612 345 678"` |
| `getIniciales(nombre)` | `'Juan Pérez García'` | `"JP"` |

Todos devuelven `'–'` o `''` si reciben `null`, `undefined` o valor inválido.

## Referencia — `constants.js`

### `PAYMENT_PERIODS` / `PAYMENT_PERIOD_LABELS`
Valores y etiquetas de las periodicidades de pago. Usar siempre estas
constantes en lugar de strings literales:

```js
PAYMENT_PERIODS.MENSUAL    // 'mensual'
PAYMENT_PERIODS.QUINCENAL  // 'quincenal'
PAYMENT_PERIODS.DIARIO     // 'diario'

PAYMENT_PERIOD_LABELS.mensual    // 'Mensual'
PAYMENT_PERIOD_LABELS.quincenal  // 'Quincenal'
PAYMENT_PERIOD_LABELS.diario     // 'Diario'
```

### `ROLES`
Roles del sistema. Usar en guards, stores y comparaciones de rol:

```js
ROLES.ADMIN      // 'admin'
ROLES.ENCARGADO  // 'encargado'
ROLES.TRABAJADOR // 'trabajador'
```

### `APP_CONFIG`
Configuración global de la app:

| Clave | Valor | Uso |
|---|---|---|
| `RETENTION_DAYS` | `60` | Días antes de purga automática vía pg_cron |
| `PIN_ROTATION_HOURS` | `24` | Frecuencia de rotación de PIN de furgoneta |
| `MAX_MOBILE_WIDTH` | `400` | Ancho máximo del contenedor móvil (px) |
| `CURRENCY` | `'EUR'` | Código ISO de moneda |
| `CURRENCY_SYMBOL` | `'€'` | Símbolo de moneda |

### `Direccion`
Rutas centralizadas. **Siempre usar `Direccion.X` en lugar de strings
literales** para evitar enlaces rotos al renombrar páginas:

```js
import { Direccion } from '../utils/constants.js'

navigate(Direccion.login)
navigate(Direccion.seccionEncargado)
```

| Clave | Ruta | Página |
|---|---|---|
| `login` | `/login` | `LoginPage` |
| `centralLogin` | `/central/login` | `CentralLoginPage` |
| `trabajadorQr` | `/trabajador/qr` | `TrabajadorQRPage` |
| `encargadoPlaza` | `/encargado/plaza` | `IngresarPlazaFurgonetaPage` |
| `seccionEncargador` | `/encargado/controlEncargado` | `SeccionEncargadoPage` |
| `centralEscanear` | `/central/escanear` | `EscanearPage` |
| `centralReporte` | `/central/reporte` | `ReporteDiarioPage` |
| `CentralTrabajadores` | `/central/trabajadores` | `TrabajadoresPage` |
| `CentralVehiculos` | `/central/vehiculos` | `VehiculosPage` |
| `CentralResumen` | `/central/resumen` | `ResumenPage` |
| `CentralTrabajadoresID` | `/central/trabajadores/:id` | `TrabajadorDetallePage` |

> Para agregar una nueva página: añadir la entrada en `Direccion`, registrar
> la ruta en `App.jsx` y actualizar esta tabla.

## Internacionalización

Toda la app está en **español de España** y usa **euros**. Los formatters
ya están localizados (`es-ES`, `EUR`). Si en el futuro se añade i18n,
extraer las cadenas hardcodeadas a un archivo `locales/es.json`.