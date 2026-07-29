import { useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

/**
 * useRealtime — Suscribe a cambios de una tabla vía WebSocket.
 *
 * @param {string}   table     Nombre de la tabla
 * @param {Function} onChange  Callback(payload) — DEBE estar memorizado (useCallback)
 * @param {Object}   [opts]    { event: 'INSERT'|'UPDATE'|'DELETE'|'*' }
 */
export function useRealtime(table, onChange, opts = {}) {
  const { event = '*' } = opts
  useEffect(() => {
    const channel = supabase
      .channel(`rt:${table}`)
      .on('postgres_changes', { event, schema: 'public', table }, (p) => onChange(p))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [table, event, onChange])
}
