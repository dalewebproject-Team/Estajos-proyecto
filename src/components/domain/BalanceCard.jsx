/**
 * BalanceCard — Card oscura con gradiente para mostrar saldo pendiente.
 *
 * Spec — sección 10 de la guía:
 *   bg-gradient-to-r from-navy-dark to-navy-medium rounded-xl p-4
 *   <p className="text-gray-400 text-xs">Balance Pendiente</p>
 *   <p className="text-primary font-bold text-2xl">$1,250.00</p>
 *
 * Lógica de color del monto:
 *   · balance > 0  → verde   (text-primary)
 *   · balance === 0 → gris   (text-gray-400)
 *
 * Props
 * ─────
 *  · label    string   (default 'Balance Pendiente')
 *  · amount   number
 *  · currency string   (default '€')  — moneda mostrada delante
 */
export default function BalanceCard({
  label    = 'Balance Pendiente',
  amount   = 0,
  currency = '€'
}) {
  const isPositive = amount > 0

  return (
    <div className="bg-gradient-to-r from-navy-dark to-navy-medium rounded-xl p-4">
      <p className="text-gray-400 text-xs">{label}</p>
      <p
        className={`font-bold text-2xl mt-1 ${
          isPositive ? 'text-primary' : 'text-gray-400'
        }`}
      >
        {currency}{Number(amount).toFixed(2)}
      </p>
    </div>
  )
}
