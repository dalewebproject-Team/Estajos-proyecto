import { Truck } from 'lucide-react'

/**
 * EmergencyScreen — Se muestra en vez de la app cuando el bloqueo de
 * emergencia está activo (ver App.jsx + activarBotonPanico). Solo el
 * logo: nadie ve datos ni funciones, pero cualquiera reconoce que es
 * un apagado intencional, no un error.
 */
export default function EmergencyScreen() {
  return (
    <div className="min-h-screen bg-navy-dark flex items-center justify-center">
      <Truck className="w-16 h-16 text-gold animate-pulse" />
    </div>
  )
}
