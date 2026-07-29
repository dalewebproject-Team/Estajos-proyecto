import { useState } from 'react'
import { Check, X } from 'lucide-react'

import Input from '../../ui/Input.jsx'
import Button from '../../ui/Button.jsx'

export default function FormTemporal({ guardando, onSubmit, onCancel }) {
  const [nombre, setNombre]   = useState('')
  const [horas, setHoras]     = useState('')
  const [destajo, setDestajo] = useState('')

  const nombreValido = nombre.trim().length > 0
  // Un temporal solo cobra por destajo (no tiene tarifa fija) — es su único pago.
  const destajoValido = parseFloat(destajo) > 0

  const handleSubmit = () => {
    if (!nombreValido || !destajoValido || guardando) return
    onSubmit({
      nombre: nombre.trim(),
      horas: parseFloat(horas) || 0,
      destajo: parseFloat(destajo) || 0,
    })
  }

  return (
    <div className="space-y-4">
      <Input
        label="Nombre del temporal"
        type="text"
        placeholder="Ej. Juan (PIPA)"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
      />
      <Input
        label="Horas (solo registro)"
        type="number"
        placeholder="0"
        value={horas}
        onChange={(e) => setHoras(e.target.value)}
      />
      <Input
        label="Destajo a pagar ($)"
        type="number"
        placeholder="0"
        value={destajo}
        onChange={(e) => setDestajo(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" icon={<X className="w-4 h-4" />} onClick={onCancel}>
          CANCELAR
        </Button>
        <Button
          variant="primary"
          icon={<Check className="w-4 h-4" />}
          disabled={!nombreValido || !destajoValido || guardando}
          onClick={handleSubmit}
        >
          {guardando ? 'PAGANDO…' : 'REGISTRAR Y PAGAR'}
        </Button>
      </div>
    </div>
  )
}