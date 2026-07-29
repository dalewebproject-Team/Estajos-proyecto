import { UserCircle } from 'lucide-react'
import CircleIcon from '../ui/CircleIcon.jsx'
import Badge      from '../ui/Badge.jsx'

/**
 * WorkerListItem — Fila clickeable de un trabajador en la lista.
 *
 * Spec — sección 11 de la guía (botón‑item):
 *   <button className="w-full bg-white rounded-2xl p-4 shadow-sm text-left
 *                      hover:shadow-md transition-all flex items-center gap-3">
 *
 * Props
 * ─────
 *  · worker  { id, nombre, telefono, paymentPeriod, balance, es_encargado }
 *      - paymentPeriod: 'mensual' | 'quincenal' | 'diario'
 *      - balance: número de saldo pendiente
 *      - es_encargado: bool — Cambio 1.3.2 (Octava llamada): se muestra un
 *        badge dorado junto al nombre para identificar de un vistazo al
 *        personal con nivel de encargado, en línea con el nuevo filtro
 *        "Encargados" de TrabajadoresPage.
 *  · onClick fn(worker)
 */
export default function WorkerListItem({ worker, onClick }) {
  const { nombre, telefono, paymentPeriod, balance = 0, es_encargado } = worker

  return (
    <button
      onClick={() => onClick?.(worker)}
      className="w-full bg-white rounded-2xl p-4 shadow-sm text-left
                 hover:shadow-md transition-all flex items-center gap-3"
    >
      <CircleIcon icon={UserCircle} size="md" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-navy-dark font-semibold text-sm truncate">
            {nombre}
          </p>
          <Badge variant={paymentPeriod} short />
          {es_encargado && (
            <Badge variant="custom" bg="bg-gold/10" text="text-gold">
              Encargado
            </Badge>
          )}
        </div>
        <p className="text-gray-500 text-[10px]">{telefono}</p>
      </div>

      <div className="text-right flex-shrink-0">
        <p
          className={`text-sm font-bold ${
            balance > 0 ? 'text-primary' : 'text-gray-400'
          }`}
        >
          €{Number(balance).toFixed(0)}
        </p>
        <p className="text-[9px] text-gray-400">por pagar</p>
      </div>
    </button>
  )
}
