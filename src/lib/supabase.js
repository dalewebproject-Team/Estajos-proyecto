import { createClient } from '@supabase/supabase-js'

/**
 * supabase — Cliente único de la app.
 *
 * Se inicializa una sola vez al importar este archivo. Toda la app
 * comparte la misma instancia → se evitan sesiones duplicadas y
 * sockets de Realtime fantasma.
 *
 * Las credenciales se leen de variables de entorno (.env.local):
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 *
 * Estas variables son PÚBLICAS (anon key) y se protegen vía RLS en
 * Postgres — nunca se expone la `service_role` al cliente.
 */
const url     = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.warn(
    '[supabase] Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. ' +
    'La app arrancará en modo "sin backend" y las llamadas fallarán.'
  )
}

export const supabase = createClient(url ?? '', anonKey ?? '', {
  auth: {
    persistSession:    true,
    autoRefreshToken:  true,
    detectSessionInUrl: false
  }
})
