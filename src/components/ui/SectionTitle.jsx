/**
 * SectionTitle — Título de sección con barra vertical de color.
 *
 * Spec — sección 5 de la guía:
 *   <div className="flex items-center gap-2 mb-4">
 *     <div className="w-1 h-5 bg-[#e8b341] rounded-full" />
 *     <h2 className="text-[#1a2332] font-bold text-sm">TITULO SECCION</h2>
 *   </div>
 *
 * Colores de la barra:
 *   · 'gold'  (default) — Configuración, vehículos, gastos
 *   · 'green'           — Registros, escaneo, trabajadores
 *   · 'red'             — Gastos, deducciones
 *
 * Props
 * ─────
 *  · color     'gold' | 'green' | 'red'
 *  · children  ReactNode (texto del título)
 */
const COLORS = {
  gold:  'bg-gold',
  green: 'bg-primary',
  red:   'bg-danger'
}

// Séptima llamada: se acepta `className` opcional para permitir ajustes
// puntuales (p. ej. `mb-0` en cabeceras de paneles plegables). Sin efecto
// en los usos existentes que no lo pasan.
export default function SectionTitle({ color = 'gold', children, className = '' }) {
  return (
    <div className={`flex items-center gap-2 mb-4 ${className}`}>
      <div className={`w-1 h-5 rounded-full ${COLORS[color]}`} />
      <h2 className="text-navy-dark font-bold text-sm uppercase">
        {children}
      </h2>
    </div>
  )
}
