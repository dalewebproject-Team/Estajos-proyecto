/**
 * PinInput — Input especializado para PIN de 4 dígitos.
 *
 * Spec — sección 6 de la guía:
 *   text-center text-2xl tracking-[0.5em]
 *   placeholder:text-sm placeholder:tracking-normal
 *
 * Comportamiento:
 *   · Solo acepta dígitos (filtrado en onChange)
 *   · Limitado a 4 caracteres
 *   · Oculta el valor (type=password) por defecto
 *
 * Props
 * ─────
 *  · label    string   (opcional)
 *  · value    string
 *  · onChange fn(nuevoValor)
 *  · masked   bool     true = password, false = number visible (default: true)
 */
export default function PinInput({
  label,
  value,
  onChange,
  masked = true
}) {
  const handleChange = (e) => {
    // Solo dígitos, máximo 4
    const clean = e.target.value.replace(/\D/g, '').slice(0, 4)
    onChange(clean)
  }

  return (
    <div>
      {label && (
        <label className="label-base">{label}</label>
      )}
      <input
        type={masked ? 'password' : 'text'}
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="0000"
        maxLength={4}
        value={value}
        onChange={handleChange}
        className="w-full mt-1.5 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl
                   text-sm text-navy-dark text-center text-2xl tracking-[0.5em]
                   placeholder-gray-400 placeholder:text-sm placeholder:tracking-normal
                   focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                   transition-all"
      />
    </div>
  )
}
