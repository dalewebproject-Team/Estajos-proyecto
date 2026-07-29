/**
 * formatters.js — Funciones puras de formateo.
 */

/**
 * Formato monetario en EUROS (es-ES).
 *   formatEUR(1250) → "1.250,00 €"
 */
export function formatEUR(value) {
  if (value === null || value === undefined || Number.isNaN(+value)) return '–'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2
  }).format(+value)
}

/**
 * Formato corto (sin decimales). Útil en listas.
 *   formatEURShort(1250.5) → "1.251 €"
 */
export function formatEURShort(value) {
  if (value === null || value === undefined || Number.isNaN(+value)) return '–'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(+value)
}

/**
 * Fecha local en español.
 *   formatFecha('2026-05-27') → "27 may 2026"
 */
export function formatFecha(input) {
  if (!input) return ''
  const d = new Date(input)
  return d.toLocaleDateString('es-ES', {
    day:   'numeric',
    month: 'short',
    year:  'numeric'
  })
}

/**
 * Formato de teléfono español (espacios cada 3 dígitos).
 *   formatTelefono('612345678') → "612 345 678"
 */
export function formatTelefono(tel) {
  if (!tel) return ''
  const clean = String(tel).replace(/\D/g, '')
  return clean.replace(/(\d{3})(?=\d)/g, '$1 ').trim()
}

/**
 * Iniciales para avatares.
 *   getIniciales('Juan Pérez García') → "JP"
 */
export function getIniciales(nombre) {
  if (!nombre) return '?'
  const partes = nombre.trim().split(/\s+/)
  const ini = (partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')
  return ini.toUpperCase()
}
