import { useState } from "react";
import Button from "../../ui/Button.jsx";
import Input  from "../../ui/Input.jsx";

/**
 * FormPlazas — Registra cuántas plazas ocupó la furgoneta ese día.
 * Se usa una sola vez por jornada, después de confirmar el PIN de furgoneta.
 *
 * @param {boolean}  guardando
 * @param {Function} onSubmit      - Recibe { plazas }
 * @param {Function} onCancel
 * @param {string}   submitLabel   - Texto del botón submit
 */
export default function FormPlazas({
  guardando,
  onSubmit,
  onCancel,
  submitLabel = 'CONFIRMAR PLAZAS'
}) {
  const [plazas, setPlazas] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ plazas })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Plazas ocupadas"
        type="number"
        placeholder="0"
        value={plazas}
        onChange={(e) => setPlazas(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" type="button" onClick={onCancel}>
          CANCELAR
        </Button>
        <Button type="submit" variant="primary" disabled={guardando || !plazas}>
          {guardando ? 'GUARDANDO…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}