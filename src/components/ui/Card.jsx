/**
 * Card — Tarjeta base. Tres variantes según sección 5 de la guía CSS.
 *
 *  · 'white'    Tarjeta blanca (uso general)              bg-white rounded-2xl p-5 shadow-sm
 *  · 'dark'     Card con gradiente oscuro (info clave)    from-navy-dark to-navy-medium
 *  · 'stat'     Card pequeña centrada (números)
 *
 * Props
 * ─────
 *  · variant    'white' | 'dark' | 'stat'
 *  · className  string  Clases extra
 *  · children   ReactNode
 */
export default function Card({
  variant   = 'white',
  className = '',
  children
}) {
  const variants = {
    white: 'bg-white rounded-2xl p-5 shadow-sm',
    dark:  'bg-gradient-to-r from-navy-dark to-navy-medium rounded-xl p-4',
    stat:  'bg-white rounded-2xl p-4 shadow-sm text-center'
  }

  return (
    <div className={`${variants[variant]} ${className}`}>
      {children}
    </div>
  )
}
