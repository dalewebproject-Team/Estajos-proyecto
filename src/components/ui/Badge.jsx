/**
 * Badge — Etiqueta pequeña de periodicidad (sección 9 de la Guía CSS).
 *
 * Variantes:
 *   · 'mensual'    → azul    bg-blue-50    text-blue-600
 *   · 'quincenal'  → morado  bg-purple-50  text-purple-600
 *   · 'diario'     → naranja bg-orange-50  text-orange-600
 *
 * También admite `variant='custom'` con `bg`/`text` propios.
 *
 * Props
 * ─────
 *  · variant 'mensual' | 'quincenal' | 'diario' | 'custom'
 *  · short   bool       Si true, muestra solo la inicial (M/Q/D)
 *  · bg      string     (solo custom) clase Tailwind de fondo
 *  · text    string     (solo custom) clase Tailwind de texto
 *  · children ReactNode Sobrescribe el texto por defecto
 */
const PRESETS = {
  mensual:   { bg: 'bg-blue-50',   text: 'text-blue-600',   label: 'Mensual',   short: 'M' },
  quincenal: { bg: 'bg-purple-50', text: 'text-purple-600', label: 'Quincenal', short: 'Q' },
  diario:    { bg: 'bg-orange-50', text: 'text-orange-600', label: 'Diario',    short: 'D' }
}

export default function Badge({
  variant = 'mensual',
  short   = false,
  bg,
  text,
  children
}) {
  const preset = PRESETS[variant] || { bg, text, label: '', short: '' }

  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${preset.bg} ${preset.text}`}
    >
      {children || (short ? preset.short : preset.label)}
    </span>
  )
}
