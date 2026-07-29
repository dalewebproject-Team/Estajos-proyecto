/**
 * CircleIcon — Avatar / icono circular oscuro con icono dorado.
 *
 * Spec — sección 13 de la guía:
 *   bg-[#1a2332] rounded-full  +  icono text-[#e8b341]
 *
 * Tamaños:
 *   · 'sm'  w-8  h-8   + icono w-4 h-4   (inline)
 *   · 'md'  w-10 h-10  + icono w-5 h-5   (lista)
 *   · 'lg'  w-12 h-12  + icono w-7 h-7   (avatar)
 *   · 'xl'  w-24 h-24  + icono w-12 h-12 (escaneo, hero)
 *
 * Props
 * ─────
 *  · icon       Componente de lucide-react
 *  · size       'sm' | 'md' | 'lg' | 'xl'
 *  · shape      'circle' | 'square'  (default 'circle')
 *  · className  string  Clases extra del contenedor
 */
const SIZES = {
  sm: { box: 'w-8  h-8',  ico: 'w-4 h-4' },
  md: { box: 'w-10 h-10', ico: 'w-5 h-5' },
  lg: { box: 'w-12 h-12', ico: 'w-7 h-7' },
  xl: { box: 'w-24 h-24', ico: 'w-12 h-12' }
}

export default function CircleIcon({
  icon: Icon,
  size      = 'md',
  shape     = 'circle',
  className = ''
}) {
  const { box, ico } = SIZES[size]
  const radius = shape === 'square' ? 'rounded-2xl' : 'rounded-full'

  return (
    <div className={`${box} bg-navy-dark ${radius} flex items-center justify-center flex-shrink-0 ${className}`}>
      <Icon className={`${ico} text-gold`} />
    </div>
  )
}
