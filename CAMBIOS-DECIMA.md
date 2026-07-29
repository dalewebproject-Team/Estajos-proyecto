# Cambios Décima — Entrega

Fecha: 2026-07-27. Continúa el trabajo de `cambios_onceava.md` (rediseño
v6.0 de base de datos y frontend, entregado el día anterior sin verificar
end-to-end). Esta sesión fue la puesta en marcha real contra un proyecto
Supabase nuevo: crear el admin, destrabar permisos, y corregir varios
bugs que solo aparecen al usar el sistema con datos reales.

---

## 1. Renombre: Destajos → Estajos

Cambiado en toda la app, incluyendo las claves técnicas (no solo el texto
visible):

- `package.json` — `name` y `description`.
- `vite.config.js` — `name`/`short_name` del manifest de la PWA.
- `src/components/layout/Header.jsx` — título visible en el Header.
- `src/store/authStore.js` — clave de persistencia en localStorage
  (`destajos-auth` → `estajos-auth`).
- `src/lib/offline.js` — nombre de la base IndexedDB de la cola offline
  (`destajos-offline` → `estajos-offline`).
- `package-lock.json` — resincronizado con `npm install --package-lock-only`.

**Efecto real de este cambio:** las sesiones activas guardadas bajo la
clave vieja (`destajos-auth`) y cualquier operación offline pendiente bajo
`destajos-offline` quedan huérfanas — a partir de este cambio, todos deben
volver a iniciar sesión, y cualquier cola offline sin sincronizar antes del
cambio no se recupera sola.

---

## 2. Admin y permisos (RLS) — la parte que más costó

**Causa raíz encontrada (no era lo que parecía al principio):** las 15
políticas RLS del esquema v6.0 comparaban `auth.jwt() ->> 'app_role'` al
nivel raíz del token, pero Supabase Auth anida los `app_metadata` custom
bajo la clave `app_metadata`, no al nivel raíz. El claim real vive en
`auth.jwt() -> 'app_metadata' ->> 'app_role'`. Por eso, aunque
`raw_app_meta_data` en `auth.users` estuviera perfecto, la comparación
**siempre daba NULL** — nunca fue un problema de caché del navegador ni de
reiniciar sesión, como se sospechó al principio.

- `013_fix_jwt_app_role.sql` — corrige las 15 políticas `admin_*` y
  `activar_boton_panico()` con la ruta correcta del JWT; elimina las
  políticas `open_*` (`USING (true)`) que se habían usado como parche
  temporal mientras se buscaba la causa real.
- `014_cerrar_huecos_restantes.sql` — dos huecos que `013` no atrapó por
  tener otro nombre: `allow_all_furgoneta` (rol `public`, `USING (true)`,
  sin restricción alguna) y una política `admin_panico_config` que había
  quedado con la ruta vieja del JWT sobre una tabla que, por diseño,
  **no debe tener ninguna política** (`panico_config` solo se toca vía RPC
  `SECURITY DEFINER`, nunca por API directa).

## 3. PIN de la furgoneta no se veía en el front

- `src/lib/api/vehicles.js` — `mapFurgoneta()` asumía que Postgrest
  devolvía `pin_furgoneta` como array (`Array.isArray(...)`); en realidad
  llega como objeto. Simplificado a `v.pin_furgoneta?.pin`.
- El círculo de cuenta regresiva (24h) dependía de `pin_actualizado_en`,
  campo que la API nunca exponía — siempre llegaba `undefined`, por eso el
  círculo se veía fijo en 0%. Se agregó `created_at` al SELECT de
  `pin_furgoneta` y se expone como `pin_actualizado_en`.

## 4. Zona del encargado

- **Empleado ya registrado no se ponía gris**: `BuscadorEmpleado.jsx`
  bloqueaba con `e.completo` (exige horas **y** destajo a la vez, algo que
  casi nunca pasa en la práctica). Cambiado a `e.registrado` (basta un solo
  registro).
- **"Mis horas" del encargado nunca se ponía gris al cerrar el día**:
  `buscar_empleados_encargado` excluye a los encargados de la lista
  (`WHERE es_encargado = false`), así que el front nunca podía saber si el
  propio encargado ya había cerrado su jornada. Se agregó la RPC
  `estado_jornada_propia_encargado(encargado_id, fecha)`
  (`015_estado_propio_encargado.sql`) y se conectó en
  `SeccionEncargadoPage.jsx`.

## 5. Tarifa histórica — aumentos de sueldo a mitad de ciclo

Problema en dos capas, encontradas y corregidas juntas
(`016_tarifa_historica_jornada.sql`, `017_registrar_jornada_con_fecha.sql`):

1. `calcular_balance_trabajador` y `ejecutar_pago_empleado` usaban el
   `pago_x_hora` **actual** del empleado para todas las horas sin liquidar
   del período. Un aumento a mitad de ciclo repriced retroactivamente
   horas ya trabajadas.
2. Más sutil: si una jornada de un día anterior al aumento se registra
   *después* de que el aumento ya ocurrió (p. ej. la del lunes se registra
   el jueves y el aumento fue el miércoles), ni siquiera un simple
   "snapshot de la tarifa al insertar" alcanza — hay que saber qué tarifa
   regía en la fecha en que **ocurrió el trabajo**, no en la que se guardó
   la fila.
3. Además se encontró que `registrar_jornada_empleado` ignoraba por
   completo la fecha elegida por el encargado en el calendario del front —
   la RPC no tenía parámetro de fecha y siempre grababa `now()`. El
   calendario solo filtraba la búsqueda, nunca afectaba el guardado.

**Solución:**

- Tabla nueva `historial_tarifa_empleado` (rangos `vigente_desde`/
  `vigente_hasta` por empleado), con triggers que la mantienen
  automáticamente al dar de alta un empleado o cambiar su `pago_x_hora`.
- Función `tarifa_vigente_en(empleado_id, fecha)` — responde "¿cuál era la
  tarifa en esa fecha?", no "¿cuál es la tarifa ahora?".
- `jornada_empleado`/`jornada_encargado` ganan la columna `tarifa_aplicada`,
  calculada contra `fecha_trabajo` al crear la fila **y recalculada si se
  corrige la fecha después** (trigger en `UPDATE OF fecha_trabajo`).
- `registrar_jornada_empleado` ahora recibe `p_fecha` y lo usa para
  `fecha_trabajo` — el calendario del encargado ya afecta de verdad lo que
  se guarda, no solo lo que se busca.
- `calcular_balance_trabajador` y `ejecutar_pago_empleado` usan
  `tarifa_aplicada` por fila en vez del `pago_x_hora` actual.
- Se corrigieron 3 lugares del frontend que hacían el mismo cálculo mal
  (mostraban totales que no iban a coincidir con lo que la BD realmente
  cobra): `getResumenPagos` (KPIs), `getDatosCicloParaPago` (Planilla /
  Lista de Pago), y el subtotal por jornada en `TrabajadorDetallePage`.
- Tabla nueva protegida con RLS igual que las demás (solo admin).

## 6. Botón "Configuración" en Central

Nuevo tab en la barra horizontal → `/central/configuracion`:

- Cambio de contraseña del admin (nativo de Supabase Auth,
  `supabase.auth.updateUser`).
- En el detalle del trabajador (`TrabajadorDetallePage`), la fila de
  "Jornadas recientes" ahora también permite **editar la fecha** de una
  jornada (antes decía explícitamente "la fecha nunca se toca"). Se
  agregó además una columna de tarifa aplicada, visible para entender por
  qué el subtotal de un día puede diferir de otro tras un aumento.

## 7. Botón de pánico

Ya estaba completo del lado del frontend (ícono de sirena en el Header,
modal de contraseña, `EmergencyScreen`) desde una entrega anterior — no
se tocó código, solo se verificó que siguiera funcionando tras el fix de
RLS/JWT (`activar_boton_panico` usaba la misma ruta de JWT rota, ya
corregida en el punto 2). Se dejó documentación privada actualizada
(fuera del repo, ver `.gitignore`) con las instrucciones vigentes para
fijar la contraseña y para reactivar el sistema.

**Nota de higiene de repo:** el archivo de documentación privada del botón
de pánico estaba, por error, siendo trackeado por git (contradice su
propio encabezado, que dice "no se sube al repositorio"). Nunca llevó una
contraseña real en el historial — solo el placeholder — pero se corrigió:
se agregó su patrón a `.gitignore` y se sacó del tracking (`git rm --cached`).

---

## Instrucciones para aplicar

Correr en el SQL Editor de Supabase, **en este orden**, sobre la base ya
migrada a v6.0 (`011_rediseno_v6.sql`):

1. `013_fix_jwt_app_role.sql`
2. `014_cerrar_huecos_restantes.sql`
3. `015_estado_propio_encargado.sql`
4. `016_tarifa_historica_jornada.sql`
5. `017_registrar_jornada_con_fecha.sql` (depende de que 016 ya haya corrido)

Del lado del frontend: `npm install` (sincroniza el rename a Estajos en
`package-lock.json`) y `npm run build` para confirmar que compila.

Botón de pánico: fijar la contraseña real corriendo el `INSERT` de
`panico_config` (ver documentación privada, fuera de este repo) y probar
una vez el ciclo completo (activar + reactivar) antes de necesitarlo de
verdad.
