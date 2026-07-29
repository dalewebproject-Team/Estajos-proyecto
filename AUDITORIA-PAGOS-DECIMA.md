# Auditoría de Caja Blanca — Módulo de Pagos de DECIMA

Fecha: 2026-07-29.
Documento de continuidad para retomar el análisis en otra sesión/chat. Contiene, sin resumir, los dos análisis realizados hasta ahora:

1. **Análisis 1** — Auditoría general del módulo de pagos (arquitectura, flujo de dinero, reglas de negocio, excepciones, seguridad, puntos críticos).
2. **Análisis 2** — Análisis detallado de `ResumenPage.jsx` (la pantalla donde se genera y dispersa el pago masivo quincenal).
3. **Notas de reconciliación** — verificación cruzada entre ambos análisis y hallazgos adicionales detectados al contrastarlos.

---

## Nota de alcance (aplica a todo el documento)

Este sistema **no es una pasarela de pagos**. Es una app React (Vite) + Supabase (Postgres + RLS + RPC) para gestionar jornaleros/trabajadores temporales: control de horas, destajo, adelantos y **liquidación en efectivo físico** entregado por un "encargado". No hay Stripe, PayPal, MercadoPago, Openpay, SPEI, tarjetas, ni SDK de cobro de ningún tipo. No hay webhooks entrantes de terceros ni tokens PCI porque no hay tarjetas involucradas.

**Límite de la auditoría**: no existe carpeta `supabase/` ni archivos `.sql` en este repositorio. Toda la lógica de negocio "dura" —las funciones RPC `ejecutar_pago_empleado`, `ejecutar_pago_furgoneta`, `registrar_jornada_empleado`, los triggers, y las políticas RLS— vive en Postgres hospedado en Supabase y **no es visible en este código**. Todo lo documentado aquí es verificable en el cliente (rutas de archivo y número de línea incluidos); donde la lógica real depende del backend invisible, se indica explícitamente.

---

# ANÁLISIS 1 — Auditoría general del módulo de pagos

## 1. Arquitectura y Flujo de Datos (Entrada de "Dinero")

No hay un "clic de pago" único — hay dos entradas de deuda y un solo mecanismo de liquidación.

**Capas**: Página (React) → `lib/api/*.js` (una función = un caso de uso, siempre hace `throw` en vez de devolver `{data,error}`, ver `src/lib/README.md`) → cliente único `supabase` (`src/lib/supabase.js`) → Postgres vía PostgREST o `.rpc()`.

**Ciclo de vida real de una "transacción":**

1. **Registro de jornada** (deuda que se acumula, no dinero que entra): el encargado busca al empleado en `src/pages/encargado/SeccionEncargadoPage.jsx:96` → `registrarJornadaEmpleado()` en `src/lib/api/records.js:57` → RPC `registrar_jornada_empleado` → inserta en `jornada_empleado` con `tarifa_aplicada` congelada a la fecha real del trabajo (no la fecha de guardado — ver hallazgo histórico en la sección 6).
2. **Adelanto** (anticipo de esa deuda): `FormAdelanto.jsx` → `registrarAdelanto()` en `src/lib/api/records.js:142` → INSERT directo en `adelanto_empleado` (sin RPC, sin validación de monto máximo).
3. **Liquidación / "pago"** (el evento que realmente "cierra" dinero): `ejecutarPago()` en `src/lib/api/records.js:179` → RPC `ejecutar_pago_empleado(empleado_id, inicio, fin)`. Esta única función es el embudo por el que pasa **todo** el dinero que sale del estado "pendiente": cierra las jornadas del período (`fue_liquidado = true`), calcula `total_pagado` restando adelantos, e inserta una fila en `pago_empleado`.
4. Dos puntos de entrada disparan este mismo `ejecutarPago`: pago individual desde `src/pages/central/EscanearPage.jsx:364` (escaneo de QR → menú → "Pagar Empleado") y pago masivo desde `src/pages/central/ResumenPage.jsx:177` vía `generarListaPago()` en `src/lib/api/paymentLists.js:88`, que llama `ejecutarPago` **en un loop, uno por empleado**.

**Tablas involucradas** (esquema v6.0, confirmado por los comentarios de mapeo en `records.js`/`workers.js`): `empleados`, `jornada_empleado`, `jornada_encargado`, `adelanto_empleado`, `pago_empleado`, `lista_pago_quincenal`, `lista_pago_detalle`. Para vehículos: `furgoneta`, `jornada_furgoneta`, `adelanto_furgoneta`, `pago_furgoneta`.

**No hay "controladores" en el sentido MVC** — no hay backend Node/Express propio. El único "controller" es Postgres vía RLS + funciones RPC (`SECURITY DEFINER`), invisibles en este repo.

## 2. Mecanismos de "Dispersión" (Salida de Dinero)

No hay payouts electrónicos. La única salida de dinero es **efectivo entregado en persona por un "encargado"**, y el sistema solo registra que ocurrió:

- **A trabajadores individuales**: botón "PAGAR EMPLEADO" en `EscanearPage` → `ejecutarPago()`.
- **A trabajadores en lote (quincenal)**: `ResumenPage.jsx` → el admin selecciona empleados con saldo pendiente, captura el **nombre de texto libre** del encargado que reparte el efectivo (`ResumenPage.jsx:407`), y `generarListaPago()` ejecuta el pago de cada uno secuencialmente. Genera además una planilla imprimible con columna de firma (`ResumenPage.jsx:580-659`) — ese papel firmado es, en la práctica, el único comprobante legal de la dispersión.
- **A "temporales"**: `FormTemporal.jsx` → `registrarTemporal()` en `src/lib/api/records.js:364`. **Importante**: el comentario del propio código lo dice — *"No genera jornada ni pago en el sistema"*. El botón dice "REGISTRAR Y PAGAR" y la UI muestra "Pagado €X", pero **no se inserta ningún registro financiero**; es solo una nota de auditoría de que alguien fue registrado. El pago real ocurre fuera del sistema, en efectivo, sin rastro contable más allá de ese log de "se registró".
- **A dueños de furgonetas/vehículos**: `ejecutarPagoVehiculo()` en `src/lib/api/records.js:189`, disparado desde `src/pages/central/VehiculoDetallePage.jsx:267`. Mismo patrón: cierra `jornada_furgoneta` y `adelanto_furgoneta` pendientes del período y crea `pago_furgoneta`.

**Pasarelas/SDKs externos usados**: ninguno. `package.json` no trae SDK de ningún banco o procesador; la única dependencia de "pago" es el propio Supabase.

## 3. Reglas de Negocio y Lógica Financiera

**¿Cuándo un pago es "válido"?** No hay validación de negocio explícita más allá de: el botón de confirmar se deshabilita si `esPagado` (ya se pagó este ciclo) o si no hay jornadas pendientes (`EscanearPage.jsx:414`). Hay un `window.confirm()` nativo de doble verificación en el pago individual (`EscanearPage.jsx:365`); en el flujo de Vehículo la confirmación pasó a modal propio (`VehiculoDetallePage.jsx:635`). La validación "dura" (¿qué jornadas cuentan, cómo se descuentan adelantos?) vive enteramente en la RPC de Postgres, **no auditable desde este repo**.

**Estados del pago**: no existe una máquina de estados tipo pendiente/aprobado/rechazado/reembolsado/disputado. Solo hay un booleano binario por fila: `fue_liquidado` (jornadas/adelantos) o su presencia/ausencia como fila en `pago_empleado`. **No existe ningún concepto de "rechazado" o "en disputa"** — como es efectivo entregado en persona, o el `ejecutarPago` tuvo éxito (se cierra todo) o falló (nada cambia, se reintenta manualmente). **No hay flujo de reembolso** en ningún archivo del código — si hay que revertir un pago ya ejecutado, no hay función para eso; habría que editarlo directo en la base de datos.

Vale aclarar: el cambio "Décima entrega" documentado en `paymentLists.js:6-13` **eliminó deliberadamente** un estado intermedio "pendiente/confirmada" que sí existía antes — ahora generar la lista ejecuta el pago de inmediato. Es una decisión de producto consciente, no un descuido, pero reduce el margen para cancelar antes de que el efectivo salga.

**Cálculo de comisiones/impuestos/descuentos**: **no existen en el código**. No hay IVA, retenciones, comisión de plataforma, ni cálculo fiscal de ningún tipo. La única "resta" que existe es `total a pagar = horas × tarifa_histórica + destajo − adelantos_pendientes` (ver `paymentLists.js:57-68` y replicado en `EscanearPage.jsx:151-152`). Nótese que `getAdelantosPendientes()` (`records.js:349`) trae **todos** los adelantos no liquidados del empleado sin filtrar por el período actual — es decir, un adelanto de hace 3 meses que quedó sin saldar se sigue descontando del próximo pago, sin límite temporal.

## 4. Excepciones y lo que el Sistema Ignora

- **La cola offline está construida pero no conectada a nada.** `lib/offline.js` implementa `queueOperation`/`syncPendingOperations` sobre IndexedDB completo y funcional. Pero por búsqueda de texto en todo `src/` se confirma que **ninguna función de escritura la usa** — `registrarJornadaEmpleado`, `registrarAdelanto`, `ejecutarPago`, etc. llaman a Supabase directo, sin chequear `navigator.onLine`. El propio `src/lib/README.md:38-55` documenta el patrón como algo que *debería* implementarse ("Cuando `useOnlineStatus() === false`, las funciones... deben encolar"), en tiempo condicional — es aspiracional, no real. **Si el encargado pierde conexión a mitad de una jornada de campo, la operación simplemente falla** y se pierde a menos que el usuario reintente manualmente.
- **No hay reintentos ni backoff** en ninguna llamada a Supabase. Un error de red se traduce directo a `err.message` en pantalla (ver cualquier `catch (err) { setError(err.message) }`).
- **No hay manejo de webhooks duplicados** porque no hay webhooks — la única mensajería asíncrona es Supabase Realtime (`useRealtime.js`), que es una suscripción unidireccional de "algo cambió en esta tabla", no un webhook firmado de un proveedor externo.
- **No hay protección contra pago doble por reintento de red.** Si el clic en "CONFIRMAR PAGO" dispara la petición, el servidor la procesa, pero la respuesta se pierde por la red — no hay ninguna clave de idempotencia en `ejecutarPago()`. La única barrera es que el botón se deshabilita mientras `paying === true` (protección de UI, no del servidor).
- **Validación de entrada débil en formularios de campo**: `FormJornada.jsx` y `FormTemporal.jsx` no ponen `min="0"` en los inputs numéricos de horas/destajo, y la condición de deshabilitado es solo `!horas` (una cadena `"0"` es truthy en JS, así que "0 horas" pasa; y nada bloquea un número negativo). Contraste: la edición de jornadas por el admin en `TrabajadorDetallePage` sí valida explícitamente `horas < 0` (`TrabajadorDetallePage.jsx:216`). Es decir, **la validación existe, pero solo en un camino, no en el de captura original en campo**.

## 5. Seguridad y Validaciones

- **No aplica PCI-DSS** — no hay datos de tarjeta en ningún punto del sistema.
- **Credenciales**: `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` en `.env.local`, correctamente listado en `.gitignore`. Es una clave *publishable* (anon), diseñada para ser pública; la seguridad real recae 100% en RLS del lado servidor — invisible en este repo, pero **el propio historial del proyecto documenta que falló**: `CAMBIOS-DECIMA.md` sección 2 relata que las 15 políticas `admin_*` comparaban el claim JWT en la ruta equivocada (`auth.jwt()->>'app_role'` en vez de `auth.jwt()->'app_metadata'->>'app_role'`), lo que hacía que la comparación **siempre diera NULL**, y que existieron políticas `open_*`/`allow_all_furgoneta` con `USING (true)` — es decir, tablas de furgonetas (relacionadas con pagos) sin ninguna restricción de acceso — usadas como parche temporal. Esto ya se corrigió según el changelog, pero es evidencia de que el modelo de permisos de este sistema **ya tuvo un agujero real de acceso no autorizado a datos de pago**, y como el SQL no está en el repo, no se puede confirmar el estado actual desde aquí.
- **Los guards de ruta en el cliente son solo de UX, no de seguridad.** El patrón `if (rol !== 'admin') navigate(Direccion.centralLogin)` que se repite en cada página central (`EscanearPage`, `TrabajadorDetallePage`, `VehiculoDetallePage`, `ConfiguracionPage`, `ResumenPage`) no protege nada por sí mismo — `rol` es estado de Zustand en `localStorage`, trivialmente editable desde DevTools. La única protección real es RLS + las funciones RPC del lado servidor.
- **Dos modelos de identidad distintos y desiguales**: el admin usa Supabase Auth real (`loginAdmin` → `signInWithPassword`, JWT firmado y verificable server-side). El "encargado" (quien de hecho reparte el efectivo) se autentica por teléfono + PIN de furgoneta vía RPC propia (`auth.js:99`) — **no genera un JWT de Supabase Auth**, solo un objeto plano que se guarda en `localStorage`. Toda mutación que el encargado hace (registrar jornada, cerrar su turno) se apoya en que el rol `anon` tiene permiso vía RLS/RPC `SECURITY DEFINER`, sin que exista una identidad verificable criptográficamente del lado del encargado. Es una decisión de diseño explícita (ver comentario en `auth.js:1-14`), pero es un modelo de confianza estructuralmente más débil que el del admin.
- **PIN de furgoneta**: rota cada `APP_CONFIG.PIN_ROTATION_HOURS = 24` horas (`constants.js:64`), pero no se observó ningún límite de intentos fallidos en el cliente para `loginEncargado` — si existe throttling, está solo en el servidor (no visible).
- **Idempotencia**: no existe a nivel de cliente para ninguna de las funciones que mueven dinero (`ejecutarPago`, `ejecutarPagoVehiculo`, `generarListaPago`). El propio código de `generarListaPago` lo admite sin rodeos: *"No es atómico entre items: si un pago falla a la mitad, los anteriores ya quedaron liquidados y la lista queda registrada"* (`paymentLists.js:83-85`).
- **"Botón de pánico"** (`src/lib/api/panico.js`): mecanismo de kill-switch real — `activarBotonPanico(password)` llama a una RPC que hace `REVOKE USAGE ON SCHEMA public`, bloqueando el acceso a **toda** la base de datos (no solo pagos) desde el frontend, mostrando `EmergencyScreen` (`App.jsx:36-51`). Es la salvaguarda de seguridad más contundente del sistema. La documentación de reactivación vive intencionalmente fuera del repo. El botón vive en `Header.jsx` (icono `Siren`), visible solo si `rol === 'admin'`, separado a propósito del botón "Salir" para evitar activaciones accidentales; el modal de confirmación aclara textualmente "No se borra ningún dato. Solo se puede reactivar entrando directamente a Supabase".

## 6. Puntos Críticos y Análisis de Impacto

### 🔴 Lo que se rompe con total certeza si se toca sin cuidado

**1. `eliminarTrabajador()` / `eliminarVehiculo()` — contradicción código vs. UI, el hallazgo más grave de esta auditoría.**
El código en `workers.js:144-149` y `vehicles.js:76-81` dice explícitamente: *"v6.0: borrado FÍSICO"* (`DELETE FROM empleados`/`furgoneta`). Pero la UI que dispara esa función afirma lo contrario en dos pantallas: `TrabajadorDetallePage.jsx:616-619` — *"Soft delete... No borra historial: jornadas, adelantos y pagos se conservan"* — y `VehiculoDetallePage.jsx:550-554`, idéntico. Un DELETE físico sobre `empleados`/`furgoneta` con historial de `pago_empleado`/`adelanto_empleado`/`jornada_empleado` referenciando esa fila por FK **o falla (violación de integridad referencial) o, si hay `ON DELETE CASCADE`, borra silenciosamente registros financieros**. Ninguna de las dos opciones es lo que el texto de la UI promete al usuario que va a pasar. Esto necesita verificarse contra el esquema real de Postgres antes de que alguien use "Dar de baja" en producción con un trabajador que tenga historial de pagos.

**2. `ejecutarPago()` / `ejecutarPagoVehiculo()` (`records.js:179-197`) — el embudo único de dinero.**
Cualquier cambio a los parámetros que se le pasan (fechas de período, ID) altera qué se liquida y qué no, sin red de seguridad visible en el cliente.

**3. La lógica de `tarifa_aplicada` (tarifa histórica congelada).**
Ya causó un bug real y documentado (`CAMBIOS-DECIMA.md` sección 5): un aumento de sueldo a mitad de ciclo repriceaba retroactivamente horas ya trabajadas, porque tanto la RPC como **tres lugares distintos del frontend** (`getResumenPagos`, `getDatosCicloParaPago`, el subtotal en `TrabajadorDetallePage`) recalculaban el total de forma independiente. Ese acoplamiento sigue existiendo: si alguien toca `mapJornada()` en `records.js:16-30` o cualquiera de esos tres cálculos sin tocar los otros dos, los montos que ve el admin en pantalla van a divergir de lo que la RPC realmente cobra — exactamente el mismo bug, otra vez.

**4. `generarListaPago()` — sin atomicidad ni rollback**, según su propio comentario (`paymentLists.js:83-85`). Un fallo a mitad del loop deja una lista con pagos parciales, sin mecanismo de reconciliación automática.

**5. `authStore.js` — la lógica de `partialize` (`authStore.js:36-43`)** que impide que la sesión de "encargado" sobreviva un refresh fue un fix deliberado de un bug de producción. Tocarla sin conocer esa historia la reintroduce.

**6. Documentación interna desactualizada que puede inducir a error a un desarrollador nuevo.** `src/lib/README.md:38` y `src/lib/api/README.md:9-12` describen una arquitectura que **ya no existe**: hablan de tablas `jornadas`/`adelantos_empleado`/`historial_pagos` (los nombres reales son `jornada_empleado`/`adelanto_empleado`/`pago_empleado`) y de **Edge Functions** `verificar-pin` y `ejecutar-pago` para las "operaciones sensibles" — pero el código real usa RPCs de Postgres normales (`.rpc('ejecutar_pago_empleado', ...)`), y `supabase.js` afirma explícitamente lo contrario: *"NO se usan Edge Functions → no requiere Docker ni despliegues"*. Esto es deuda técnica de documentación con riesgo real: alguien que confíe en el README para entender el modelo de seguridad ("las operaciones sensibles van a Edge Functions") tendrá una imagen equivocada de dónde vive realmente la protección de `ejecutar_pago_empleado`.

### 🟢 Lo que es seguro modificar sin riesgo sobre el flujo de dinero

- **`utils/formatters.js`** — funciones puras de formato (`formatEUR`, `formatFecha`, etc.), cero acoplamiento con lógica de pago.
- **Componentes de UI puros** (`Button`, `Card`, `Input`, `Modal`, `Badge`, `CircleIcon`, `SectionTitle`) — presentación sin lógica de negocio.
- **Metadatos de vehículo/trabajador** (nombre, matrícula, propietario, teléfono) vía `actualizarVehiculo`/`actualizarTrabajador` — el propio código aclara que estos cambios **no son retroactivos**, no tocan jornadas ya calculadas.
- **Exportación a Excel e impresión** (`handleExportarExcel`, `PlanillaImprimible`, `ListaPagoImprimible`) — el comentario del propio código lo garantiza: *"Solo informativo: no llama a ninguna función de pago, no marca a nadie como pagado ni descuenta nada"* (`ResumenPage.jsx:236-239`).
- **`constants.js`** (`Direccion`, `PAYMENT_PERIODS`, `APP_CONFIG`) — diseñado explícitamente como single-source-of-truth para extender rutas o periodicidades sin tocar lógica dispersa.

## Resumen ejecutivo de riesgos (ordenados por severidad)

| # | Hallazgo | Severidad |
|---|---|---|
| 1 | "Dar de baja" hace `DELETE` físico pero la UI promete conservar historial | 🔴 Crítico — verificar antes de usar en producción |
| 2 | Sin idempotencia en `ejecutarPago`/`generarListaPago`; loop no atómico admitido por el propio código | 🔴 Alto |
| 3 | Historial de RLS con agujeros reales ya detectados (JWT en ruta incorrecta, políticas `open_*`) | 🟠 Alto (mitigado según changelog, no verificable desde este repo) |
| 4 | Cola offline construida pero no conectada — pérdida silenciosa de operaciones sin red | 🟠 Medio |
| 5 | Documentación (`lib/README.md`, `lib/api/README.md`) describe una arquitectura de Edge Functions que no existe | 🟡 Medio (riesgo de confusión para el equipo) |
| 6 | Sesión de "encargado" sin JWT verificable, solo estado de cliente | 🟡 Medio (por diseño, pero vale documentarlo como decisión consciente) |
| 7 | Sin validación de horas/destajo negativos en captura de campo | 🟡 Bajo-medio |
| 8 | "Temporal": el botón dice "REGISTRAR Y PAGAR" pero no crea ningún registro financiero | 🟡 Bajo (posible gap contable, no de seguridad) |

---

# ANÁLISIS 2 — `ResumenPage.jsx` en detalle

## 1. Ubicación en la arquitectura de la app

`ResumenPage` es una de las 6 pantallas del panel **Central** (rol `admin`), montada en la ruta `Direccion.CentralResumen` (`/central/resumen`), registrada en `App.jsx:75`. Forma parte de la pestaña **"Resumen"** del `HorizontalNav.jsx:28`, junto a Escanear, Reporte Diario, Registros, Vehículos y Configuración.

Stack detectado (`package.json`): React 18 + Vite + React Router 6 + Zustand (estado global) + Tailwind (estilos por clases) + `@supabase/supabase-js` (backend) + `xlsx` (exportación Excel) + `lucide-react` (iconos). Es una PWA ("descripción: PWA de gestión de personal y vehículos").

## 2. Guard de acceso (seguridad de ruta)

```js
useEffect(() => {
  if (rol !== 'admin') { navigate(Direccion.centralLogin, { replace: true }); return }
  getResumenPagos().then(setStats).catch(console.error)
}, [rol, navigate])
```

`rol` viene de `useAuthStore` (Zustand + `persist` en `localStorage`, ver `authStore.js`). Es **un guard puramente de cliente**: si `rol !== 'admin'` redirige a `/central/login`. No hay verificación de sesión real de Supabase aquí — la seguridad de datos de verdad depende de RLS en Postgres (ver sección 6), no de este `if`.

También hay un guard global en `App.jsx:43-51`: antes de renderizar cualquier ruta, hace un `select('id').limit(1)` a `empleados`; si el error es `42501` (permission denied) muestra `EmergencyScreen` — es el "botón de pánico" activado desde el `Header` (ver más abajo).

## 3. Composición visual (front-end)

```
Header (logout + botón pánico si admin)
HorizontalNav (tabs)
├─ Card "Resumen General" → 2 StatCard (quincenal / mensual, desde getResumenPagos)
├─ Card "Ciclo de pago" → toggle Quincenal/Mensual + botones Exportar Excel / Exportar Planilla
├─ (si hay error) banner rojo
├─ Card "Lista de pago quincenal" (solo si ciclo === 'quincenal') → wizard de 3 pasos
└─ Card "Listas generadas · Quincenal" (historial, acordeón + reimpresión)
+ 2 bloques <div className="hidden print:block"> fuera del layout normal,
  solo visibles al imprimir (PlanillaImprimible / ListaPagoImprimible)
```

Componentes UI reutilizables: `Card`, `Button` (5 variantes: primary/dark/outline/gold/pill), `Input`, `SectionTitle`, `StatCard`. Todo el layout es mobile-first (`max-w-md mx-auto`, PWA para móvil).

El `Header` tiene el **botón de pánico** (`Siren`, solo visible si `rol==='admin'`): pide contraseña y llama `activarBotonPanico`, que ejecuta un `REVOKE USAGE ON SCHEMA public` en la BD — corta el acceso a **toda** la base de datos desde la app, sin forma de revertirlo desde el cliente. No es parte de la lógica de `ResumenPage`, pero convive en su misma cabecera.

## 4. Estado interno (useState)

| Estado | Uso |
|---|---|
| `stats` | `{quincenal, mensual}` — KPIs globales de deuda pendiente |
| `ciclo` | `'quincenal' \| 'mensual'` — pestaña activa |
| `datos` | `{periodo, empleados[]}` del ciclo activo, con jornadas/adelantos/totales ya calculados |
| `cargandoCiclo`, `genError`, `generando` | loading / error del flujo de generación |
| `seleccionados` | `Set` de IDs de empleados marcados en el checklist |
| `modoLista` | máquina de estados: `'idle' → 'seleccion' → 'encargado'` |
| `busqueda`, `encargadoNombre` | inputs del wizard |
| `listas`, `listaAbierta`, `itemsPorLista` | historial de listas ya generadas + acordeón + cache de items por lista |
| `listaAImprimir` | controla cuál de los dos bloques ocultos se marca `print:block` antes de `window.print()` |

## 5. Flujo funcional completo

### 5.1 Carga inicial y KPIs

Al montar (si `rol==='admin'`) llama `getResumenPagos()` → dos queries paralelas a `jornada_empleado` y `jornada_encargado` filtrando `fue_liquidado=false`, hace el join con `empleado`/`encargado` para leer `tipo_pago` y `pago_x_hora`, y sobre cada fila calcula `horas*tarifa + destajo` (usando `tarifa_aplicada` si existe, si no la tarifa actual), acumulando en `resumen.quincenal` / `resumen.mensual`. Esto alimenta las dos `StatCard` — **es dinero devengado pendiente de pago**, no un contador de filas.

### 5.2 Selector de ciclo (`cambiarCiclo`)

Al cambiar entre Quincenal/Mensual se resetea todo el wizard (`modoLista`, selección, búsqueda, encargado, error) y se dispara `cargarCiclo()`, que llama `getDatosCicloParaPago(ciclo)` (`paymentLists.js:43`):

1. `calcularPeriodoCiclo(ciclo)` calcula el rango de fechas en **puro JS** (sin BD): quincenal = 1–15 / 16–fin de mes según el día actual; mensual = mes calendario completo.
2. `listarTrabajadores({periodo: ciclo})` trae los empleados de ese `tipo_pago` desde `empleados`.
3. Por cada empleado, en paralelo: `getJornadasTrabajadorPorPeriodo` (jornadas no liquidadas del rango, mezclando `jornada_empleado` + `jornada_encargado`) y `getAdelantosPendientes` (`adelanto_empleado` con `fue_liquidado=false`).
4. Calcula `totalHoras`, `totalDevengado` (usando la tarifa **congelada** en cada jornada — `tarifa_aplicada` —, no la tarifa actual del empleado, para que un aumento de sueldo a mitad de ciclo no recalcule horas ya trabajadas), `totalAdelantos` y `totalPagar = totalDevengado - totalAdelantos`.

Este mismo objeto `datos.empleados` alimenta **tres cosas distintas**: la exportación a Excel, la planilla imprimible y el selector de la lista de pago — es la fuente única de verdad, evitando que los tres muestren números distintos.

### 5.3 Exportación a Excel (`handleExportarExcel`)

100% cliente, no llama a BD adicional: usa `datos.empleados` ya cargado. Construye una matriz (nombre + una columna por día del período, formato `dd/mm`) con `XLSX.utils.aoa_to_sheet`, arma el libro y descarga con `XLSX.writeFile`. Es **solo lectura/informativo** — no marca nada como pagado.

### 5.4 Exportación de planilla (impresión)

`handleImprimirPlanilla` limpia `listaAImprimir` y llama `window.print()` en un `setTimeout(0)` (para esperar el re-render). El componente `PlanillaImprimible` (`ResumenPage.jsx:504`) está oculto en pantalla (`hidden`) y solo se muestra vía CSS `print:block` — es una tabla HTML nativa con formato específico (colores fijos: amarillo para días, rosa "Destajo", azul "Total", azul oscuro "Pagar"), sin librerías de PDF, replicando un formato pedido ("base impresion.pdf" según el comentario).

### 5.5 Generación de lista de pago (solo ciclo quincenal) — el flujo más sensible

Máquina de 3 pasos (`modoLista`):

**`idle`** → botón "GENERAR LISTA" (`abrirFlujoLista`).

**`seleccion`** → buscador (filtra `datos.empleados` en memoria por nombre) + checklist. Solo son seleccionables empleados con `totalPagar > 0` (`empleadoSeleccionable`); quien ya no tiene saldo simplemente no aparece — no hay estado "pendiente" que gestionar manualmente. Muestra subtotal de seleccionados en tiempo real. "ACEPTAR" (`irACapturarEncargado`) exige al menos 1 seleccionado.

**`encargado`** → captura el nombre de la persona que reparte el efectivo en mano (texto libre, sin validación contra una tabla de encargados). Botón "GENERAR Y PAGAR" dispara `handleGenerarLista`, que llama a `generarListaPago(...)` (`paymentLists.js:88`):

```
1. INSERT en lista_pago_quincenal (ciclo, periodo_inicio/fin, monto_total, encargado)
2. INSERT en lista_pago_detalle, uno por empleado (total_devengado, total_adelantos, monto_incluido) — congela los montos mostrados en pantalla
3. Por cada item: ejecutarPago() → RPC ejecutar_pago_empleado (misma RPC que usa el flujo de "Escanear")
```

**Puntos críticos de este flujo:**

- **No es atómico**: el comentario en el propio código lo advierte — si el RPC de pago falla a mitad de la lista, los empleados anteriores ya quedaron liquidados y la lista queda registrada a medias; solo se informa el error, no hay rollback.
- El pago se ejecuta **inmediatamente** al generar la lista (Cambio Décima elimina el estado "pendiente/confirmada" que existía antes) — no hay paso de confirmación posterior.
- Tras éxito, recarga en paralelo `cargarListas()` y `cargarCiclo()` — los empleados recién pagados desaparecen solos del selector porque su `totalPagar` vuelve a 0.

### 5.6 Historial de listas generadas

Lista las filas de `lista_pago_quincenal` filtradas en memoria por `ciclo` activo (`listasDelCiclo`). Cada una es expandible (`handleVerItems` → `getItemsListaPagoConJornadas`, que trae `lista_pago_detalle` + join a `empleados` + reconstruye las jornadas día-por-día de ese período para poder reimprimirlas). Cachea por `listaId` en `itemsPorLista` para no re-consultar al reabrir. Botón "IMPRIMIR" siempre disponible (reimpresión ilimitada) vía `ListaPagoImprimible`, el segundo bloque oculto con formato idéntico a la planilla pero con columna de "Firma" añadida y filtrado solo a los empleados de esa lista específica.

## 6. Conexión con la base de datos (Supabase/Postgres)

Cliente único en `supabase.js`, instanciado con `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (variables públicas, protegidas por RLS — nunca se expone `service_role`). Toda la app comparte esta instancia.

**Tablas tocadas directa o indirectamente por esta página** (esquema "v6.0", mapeado en la capa `lib/api/*`):

| Tabla | Uso desde esta página |
|---|---|
| `empleados` | Lectura vía `listarTrabajadores` (nombre, tarifa, tipo de pago) |
| `jornada_empleado` / `jornada_encargado` | Lectura de horas/destajo pendientes (`fue_liquidado=false`) para KPIs, planilla y lista de pago |
| `adelanto_empleado` | Lectura de adelantos pendientes (se restan del total a pagar) |
| `pago_empleado` | No se toca directo aquí, pero es lo que actualiza la RPC `ejecutar_pago_empleado` |
| `lista_pago_quincenal` | INSERT (crear lista) + SELECT (historial) |
| `lista_pago_detalle` | INSERT (congelar montos por empleado) + SELECT (ver items) |

**Funciones RPC de Postgres invocadas indirectamente**: `ejecutar_pago_empleado` (dentro de `generarListaPago`, una vez por empleado) — es la única que efectivamente cierra jornadas y descuenta adelantos; toda la demás lectura son `select()` directos vía PostgREST protegidos por RLS (rol admin autenticado con Supabase Auth por email/password, ver `auth.js:122`).

No hay uso de **Realtime** ni **Storage** de Supabase en esta pantalla — todo es `select`/`insert`/`rpc` puntuales bajo demanda (sin suscripciones).

## 7. Notas de diseño / posibles puntos débiles

- **Falta de atomicidad** en `generarListaPago` (ya señalado en los comentarios del propio código) — riesgo real de inconsistencia si un `ejecutar_pago_empleado` falla a mitad de un lote grande.
- El nombre del "encargado" que reparte el efectivo es texto libre, no una FK a `empleados` — no hay trazabilidad fuerte de quién lo cobró.
- El guard `rol !== 'admin'` es solo de UI (client-side); la protección real de datos recae en las políticas RLS de Supabase, que no están en este repo (no hay carpeta `supabase/migrations` con `.sql`, así que el esquema completo vive solo en Supabase remoto, no versionado localmente).
- `handleImprimirPlanilla`/`handleImprimirLista` dependen de un `setTimeout(0)` para sincronizar el estado de React con el DOM antes de `window.print()` — funciona pero es un patrón frágil si el render tarda más de un tick.

---

# NOTAS DE RECONCILIACIÓN ENTRE AMBOS ANÁLISIS

Verificación cruzada realizada leyendo `Header.jsx`, `HorizontalNav.jsx` y `package.json` directamente:

- **Confirmado exacto**: los 6 tabs del `HorizontalNav` (Escanear, Reporte Diario, Resumen, Registros, Vehículos, Configuración); el botón de pánico (`Siren`) visible solo si `rol === 'admin'`, con modal que aclara *"No se borra ningún dato. Solo se puede reactivar entrando directamente a Supabase"*; y las dependencias de `package.json` (React 18.3, React Router 6.26, Zustand 4.5, Tailwind 3.4, `xlsx` 0.18, `@supabase/supabase-js` 2.110, `lucide-react` 0.383).
- **Sin contradicciones** entre el Análisis 1 y el Análisis 2 — ambos coinciden en: la no-atomicidad de `generarListaPago`, el guard de ruta client-side sin valor de seguridad real, y el rol del botón de pánico como kill-switch total (no exclusivo de pagos).
- **Hallazgo adicional detectado al reconciliar**: `package.json` incluye el **CLI de Supabase como devDependency** (`"supabase": "^2.110.0"`) — es decir, el proyecto tiene instalada la herramienta para versionar migraciones localmente (`supabase/migrations/*.sql`), pero esa carpeta **no existe en el repo**. Esto refuerza el límite de auditoría ya señalado: el esquema real, las RPCs de pago y las políticas RLS viven *solo* en el proyecto remoto de Supabase, nunca comprometidas a control de versiones local pese a tener la herramienta disponible para hacerlo. Es deuda técnica de gobernanza de código, no solo un límite de esta auditoría.

## Pendiente para la siguiente sesión

Preguntas abiertas planteadas y aún sin resolver (requieren acceso directo al SQL Editor de Supabase, que este análisis no tiene):

1. ¿`empleados`/`furgoneta` tienen FKs `ON DELETE CASCADE` o `RESTRICT` desde `pago_empleado`/`adelanto_empleado`/`jornada_empleado` (y sus equivalentes de furgoneta)? — Resuelve el hallazgo crítico #1 (borrado físico vs. promesa de "soft delete" en la UI).
2. ¿Qué hace exactamente `ejecutar_pago_empleado` y `ejecutar_pago_furgoneta` línea por línea? (no está en el repo — solo se infiere su contrato desde cómo se le llama).
3. ¿El estado actual de las políticas RLS post-`013_fix_jwt_app_role.sql`/`014_cerrar_huecos_restantes.sql` cierra realmente todos los huecos, o quedan otras políticas `open_*`/`allow_all_*` sin detectar?
4. Opciones para continuar: (a) diagrama de flujo/secuencia del pago, o (b) redactar las queries de introspección de esquema para que el usuario las corra en el SQL Editor de Supabase y se revisen los resultados juntos.
