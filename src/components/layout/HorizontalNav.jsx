import { NavLink } from 'react-router-dom'
import {
  ScanLine,
  FileText,
  BarChart3,
  Users,
  Truck,
  Settings
} from 'lucide-react'

//IMPORTACIÓN IMPORTANTE:  Direccion de constants.js : Para el uso de direcciones
import { Direccion } from '../../utils/constants'


/**
 * HorizontalNav — Tabs con scroll horizontal del panel Central.
 *
 * Spec — sección 8 de la guía:
 *   <div className="bg-white border-b border-gray-100">
 *     <div className="flex overflow-x-auto px-2 py-2 gap-1 scrollbar-hide">
 *       <button ... bg-[#2ecc71] text-white rounded-full text-xs ...>
 */

//[Vinculo Global] Se usa la ruta centralizada definida en constants.js 
const TABS = [
  { to: Direccion.centralEscanear ,     icon: ScanLine,  label: 'Escanear' },
  { to: Direccion.centralReporte  ,      icon: FileText,  label: 'Reporte Diario' },
  { to: Direccion.CentralResumen ,      icon: BarChart3, label: 'Resumen' },
  // Cambio 1.3.1 (Séptima llamada): la sección pasa a llamarse "Registros"
  // (la ruta interna no cambia para no romper enlaces).
  { to: Direccion.CentralTrabajadores , icon: Users,     label: 'Registros' },
  { to: Direccion.CentralVehiculos,    icon: Truck,     label: 'Vehículos' },
  { to: Direccion.CentralConfiguracion, icon: Settings, label: 'Configuración' }
]

export default function HorizontalNav() {
  return (
    <nav className="bg-white border-b border-gray-100">
      <div className="flex overflow-x-auto px-2 py-2 gap-1 scrollbar-hide">
        {TABS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-full text-xs whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-primary text-white font-semibold'
                  : 'text-gray-600 hover:bg-gray-100 font-medium'
              }`
            }
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
