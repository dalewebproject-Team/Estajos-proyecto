import Input  from '../../ui/Input.jsx'
import Button from '../../ui/Button.jsx'

/**
 * Props:
 *  - values: objeto con los campos
 *  - onChange: (campo) => (e) => void
 *  - onSubmit: () => void
 *  - saving: bool
 *  - error: string | null
 */
export default function FormVehiculo({
  values,
  onChange,
  onSubmit,
  saving,
  error,
}) {
  const canSubmit = values.nombre?.trim() && values.matricula?.trim()

  return (
    <div className="space-y-4">
      {error && <p className="text-danger text-xs">{error}</p>}

      <Input
        label="Nombre"
        value={values.nombre}
        onChange={onChange('nombre')}
      />
      <Input
        label="Matrícula"
        value={values.matricula}
        onChange={onChange('matricula')}
      />
      <Input
        label="Plazas totales"
        type="number"
        value={values.plazas_totales}
        onChange={onChange('plazas_totales')}
      />
      <Input
        label="Tarifa por plaza (€)"
        type="number"
        value={values.tarifa_plaza}
        onChange={onChange('tarifa_plaza')}
      />
      <div>
        <label className="label-base">Tipo de Pago</label>
        <select
          value={values.tipo_pago}
          onChange={onChange('tipo_pago')}
          className="input-base"
        >
          <option value="quincenal">Quincenal</option>
          <option value="mensual">Mensual</option>
        </select>
      </div>
      <Input
        label="Propietario"
        value={values.propietario}
        onChange={onChange('propietario')}
      />
      <Input
        label="PIN (4 díg, opcional — aleatorio si vacío)"
        value={values.pin_actual}
        onChange={onChange('pin_actual')}
        maxLength={4}
      />

      <Button
        variant="primary"
        onClick={onSubmit}
        disabled={saving || !canSubmit}
      >
        {saving ? 'GUARDANDO…' : 'GUARDAR'}
      </Button>
    </div>
  )
}