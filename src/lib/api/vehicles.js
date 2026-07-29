import { supabase } from '../supabase.js'

/**
 * ─── VEHÍCULOS / FURGONETAS (esquema v6.0) ─────────────────
 * Tabla `furgoneta` (apodo/costo_plaza) + `pin_furgoneta` (1:1). Esta capa
 * traduce a la forma que ya usa la app:
 *   furgoneta.apodo        → .nombre
 *   furgoneta.costo_plaza  → .tarifa_plaza
 *   pin_furgoneta.pin      → .pin_actual
 * Plazas del día viven en `jornada_furgoneta` (antes `plazas_vehiculo`);
 * los adelantos en `adelanto_furgoneta`.
 */

const SELECT_FURGONETA =
  'id, nombre:apodo, matricula, plazas_totales, tarifa_plaza:costo_plaza, propietario, tipo_pago, pin_furgoneta ( pin, created_at )'

// Aplana el PIN embebido a `pin_actual` y expone `activo: true` sintético
// (v6.0 no tiene borrado lógico).
const mapFurgoneta = (v) => v && {
  id: v.id,
  nombre: v.nombre,
  matricula: v.matricula,
  plazas_totales: v.plazas_totales,
  tarifa_plaza: v.tarifa_plaza,
  propietario: v.propietario,
  tipo_pago: v.tipo_pago,
  pin_actual: v.pin_furgoneta?.pin,
  pin_actualizado_en: v.pin_furgoneta?.created_at,
  activo: true,
}

// Traduce un payload de la app a las columnas de `furgoneta`. `pin_actual`
// no se guarda aquí (vive en pin_furgoneta, autogenerado por trigger).
function aColumnasFurgoneta(datos) {
  const out = {}
  if ('nombre' in datos)         out.apodo          = datos.nombre
  if ('matricula' in datos)      out.matricula      = datos.matricula?.trim() || null
  if ('tarifa_plaza' in datos)   out.costo_plaza    = datos.tarifa_plaza
  if ('tipo_pago' in datos)      out.tipo_pago      = datos.tipo_pago
  if ('plazas_totales' in datos) out.plazas_totales = datos.plazas_totales
  if ('propietario' in datos)    out.propietario    = datos.propietario?.trim() || null
  return out
}

export async function listarVehiculos() {
  const { data, error } = await supabase
    .from('furgoneta')
    .select(SELECT_FURGONETA)
    .order('apodo')
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapFurgoneta)
}

export async function getVehiculoPorId(id) {
  const { data, error } = await supabase
    .from('furgoneta').select(SELECT_FURGONETA).eq('id', id).single()
  if (error) throw new Error(error.message)
  return mapFurgoneta(data)
}

export async function crearVehiculo(payload) {
  // El trigger de BD crea la fila de pin_furgoneta automáticamente.
  const { data, error } = await supabase
    .from('furgoneta').insert(aColumnasFurgoneta(payload)).select(SELECT_FURGONETA).single()
  if (error) throw new Error(error.message)
  return mapFurgoneta(data)
}

export async function actualizarVehiculo(id, cambios) {
  const { data, error } = await supabase
    .from('furgoneta').update(aColumnasFurgoneta(cambios)).eq('id', id).select(SELECT_FURGONETA).single()
  if (error) throw new Error(error.message)
  return mapFurgoneta(data)
}

export async function eliminarVehiculo(id) {
  // v6.0: borrado FÍSICO. El trigger de BD lo bloquea si hay jornada activa
  // o nómina de terceros sin liquidar en esta furgoneta.
  //
  // Mitigación temporal (auditoría 2026-07-29): las FK hacia pago_furgoneta,
  // adelanto_furgoneta y jornada_furgoneta son ON DELETE CASCADE, así que este
  // delete borraría recibos y jornadas reales sin aviso. Hasta que exista la
  // liquidación forzada (RPC dedicada), se bloquea aquí si hay cualquier
  // historial asociado.
  const [pagos, adelantos, jornadas] = await Promise.all([
    supabase.from('pago_furgoneta').select('id', { count: 'exact', head: true }).eq('furgoneta_id', id),
    supabase.from('adelanto_furgoneta').select('id', { count: 'exact', head: true }).eq('furgoneta_id', id),
    supabase.from('jornada_furgoneta').select('id', { count: 'exact', head: true }).eq('furgoneta_id', id),
  ])
  for (const r of [pagos, adelantos, jornadas]) {
    if (r.error) throw new Error(r.error.message)
  }
  const motivos = []
  if (pagos.count > 0) motivos.push(`${pagos.count} pago(s)`)
  if (adelantos.count > 0) motivos.push(`${adelantos.count} adelanto(s)`)
  if (jornadas.count > 0) motivos.push(`${jornadas.count} jornada(s)`)
  if (motivos.length > 0) {
    throw new Error(
      `No se puede dar de baja: esta furgoneta tiene ${motivos.join(', ')} registrados. ` +
      `La baja está deshabilitada mientras no exista un flujo de liquidación forzada — contacta a soporte.`
    )
  }

  const { error } = await supabase.from('furgoneta').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

/* ─── Jornada de furgoneta (plazas por día) ──────────────────────────── */

// Editar plazas de un día puntual (admin). Único campo editable.
export async function actualizarPlazasVehiculoDia(id, plazas) {
  const { data, error } = await supabase
    .from('jornada_furgoneta')
    .update({ plazas_ocupadas: plazas })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

// Días pendientes de pago de la furgoneta (para "Historial de Días").
export async function listarPlazasVehiculoPendientes(vehiculoId) {
  const { data, error } = await supabase
    .from('jornada_furgoneta')
    .select('id, fecha:fecha_trabajo, plazas:plazas_ocupadas')
    .eq('furgoneta_id', vehiculoId)
    .eq('fue_liquidado', false)
    .not('fecha_trabajo', 'is', null)
    .order('fecha_trabajo', { ascending: false })
  if (error) throw new Error(error.message)
  // La tarifa aplicada v6.0 es la actual de la furgoneta (no congelada); el
  // subtotal se recalcula en el cliente. Se expone el campo para compat.
  return (data ?? []).map((d) => ({
    id: d.id,
    fecha: d.fecha ? String(d.fecha).slice(0, 10) : d.fecha,
    plazas: d.plazas,
    tarifa_plaza_aplicada: null,
    encargado: null,
  }))
}

/* ─── Adelantos de furgoneta ─────────────────────────────────────────── */

export async function listarAdelantosVehiculoPendientes(vehiculoId) {
  const { data, error } = await supabase
    .from('adelanto_furgoneta')
    .select('id, concepto, monto, fecha_adelanto, fue_liquidado')
    .eq('furgoneta_id', vehiculoId)
    .eq('fue_liquidado', false)
    .order('fecha_adelanto', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((a) => ({
    id: a.id, concepto: a.concepto, monto: Number(a.monto),
    fecha: a.fecha_adelanto, pagado_en: a.fue_liquidado ? true : null,
  }))
}

export async function getTotalAdelantosVehiculoPendientes(vehiculoId) {
  const { data, error } = await supabase
    .from('adelanto_furgoneta')
    .select('monto')
    .eq('furgoneta_id', vehiculoId)
    .eq('fue_liquidado', false)
  if (error) throw new Error(error.message)
  return (data ?? []).reduce((s, a) => s + Number(a.monto || 0), 0)
}

export async function registrarAdelantoVehiculo({ vehiculoId, concepto, monto }) {
  const { data, error } = await supabase
    .from('adelanto_furgoneta')
    .insert({ furgoneta_id: vehiculoId, concepto: concepto?.trim() || null, monto })
    .select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function actualizarMontoAdelantoVehiculo(id, monto) {
  const { data, error } = await supabase
    .from('adelanto_furgoneta')
    .update({ monto })
    .eq('id', id)
    .select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function eliminarAdelantoVehiculo(id) {
  const { data, error } = await supabase
    .from('adelanto_furgoneta')
    .delete()
    .eq('id', id)
    .eq('fue_liquidado', false)
    .select()
  if (error) throw new Error(error.message)
  if (!data || data.length === 0) {
    throw new Error('Este adelanto ya fue liquidado y no se puede eliminar.')
  }
}

/* ─── PIN de la furgoneta (tabla pin_furgoneta, rotación) ─────────────── */

export async function rotarPinVehiculo(vehiculoId) {
  const { data, error } = await supabase.rpc('rotar_pin_furgoneta', { p_furgoneta_id: vehiculoId })
  if (error) throw new Error(error.message)
  return { pin_actual: data }   // la RPC devuelve el nuevo PIN
}
