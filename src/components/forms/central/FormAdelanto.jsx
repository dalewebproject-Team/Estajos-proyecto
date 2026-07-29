import Input  from '../../ui/Input.jsx'
import Button from '../../ui/Button.jsx'

/**
 * Props:
 *  - monto: string
 *  - onChangeMonto: (e) => void
 *  - onSubmit: () => void
 *  - saving: bool
 *  - error: string | null
 *  - compact: bool  → modo inline (fila) vs. bloque (modal)
 */
export default function FormAdelanto({
  monto,
  onChangeMonto,
  onSubmit,
  saving,
  error,
  compact = false,
}) {
  if (compact) {
    return (
      <div className="space-y-2">
        {error && <p className="text-danger text-xs">{error}</p>}
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Monto €"
            value={monto}
            onChange={onChangeMonto}
            className="flex-1"
          />
          <Button
            variant="primary"
            onClick={onSubmit}
            disabled={saving || !monto}
          >
            {saving ? '…' : 'DAR'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-danger text-xs">{error}</p>}
      <Input
        label="Monto del adelanto (€)"
        type="number"
        value={monto}
        onChange={onChangeMonto}
      />
      <Button
        variant="primary"
        onClick={onSubmit}
        disabled={saving || !monto}
      >
        {saving ? 'GUARDANDO…' : 'REGISTRAR ADELANTO'}
      </Button>
    </div>
  )
}