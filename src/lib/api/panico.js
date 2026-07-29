import { supabase } from '../supabase.js'

/**
 * Bloqueo de emergencia (Séptima llamada): revoca el acceso a toda la
 * base de datos desde la app (ver migración 007_boton_panico.sql). No
 * borra nada — la reactivación va en documentación privada, fuera del
 * repositorio.
 */
export async function activarBotonPanico(password) {
  const { data, error } = await supabase.rpc('activar_boton_panico', { p_password: password })
  if (error) throw new Error(error.message)
  return data === true
}
