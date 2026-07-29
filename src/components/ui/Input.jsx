/**
 * Input — Sección 6 de la Guía Técnica CSS.
 *
 * Spec base:
 *   bg-gray-50 border border-gray-200 rounded-xl px-4 py-3
 *   focus:ring-2 focus:ring-primary
 *
 * Props
 * ─────
 *  · label       string   Texto en mayúsculas, gris pequeño
 *  · type        'text' | 'tel' | 'email' | 'password' | 'date' | 'number'
 *  · placeholder string
 *  · value       string
 *  · onChange    fn
 *  · maxLength   number
 *  · required    bool
 *  · className   string   Clases extra al <input>
 */
export default function Input({
  label,
  type        = 'text',
  placeholder = '',
  value,
  onChange,
  maxLength,
  required    = false,
  className   = '',
  ...rest
}) {
  return (
    <div>
      {label && (
        <label className="label-base">
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        required={required}
        className={`input-base ${className}`}
        {...rest}
      />
    </div>
  )
}
