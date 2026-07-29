/**
 * StatCard — Card pequeña centrada con un número grande.
 *
 * Spec — sección 5 de la guía (Card stat):
 *   <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
 *     <p className="text-2xl font-bold text-navy-dark">3</p>
 *     <p className="text-gray-500 text-xs mt-1 uppercase">Trabajadores</p>
 *   </div>
 *
 * Props
 * ─────
 *  · value     string | number   El número/valor destacado
 *  · label     string            Etiqueta debajo
 *  · color     'navy' | 'primary' | 'danger' | 'gold'   Color del valor
 */
const COLORS = {
  navy:    'text-navy-dark',
  primary: 'text-primary',
  danger:  'text-danger',
  gold:    'text-gold'
}

export default function StatCard({ value, label, color = 'navy' }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
      <p className={`text-2xl font-bold ${COLORS[color]}`}>{value}</p>
      <p className="text-gray-500 text-xs mt-1 uppercase">{label}</p>
    </div>
  )
}
