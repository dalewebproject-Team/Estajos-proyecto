import { useNavigate } from 'react-router-dom'

import Header               from '../components/layout/Header.jsx'
import FormAccesoUnificado  from '../components/forms/login/FormAccesoUnificado.jsx'
import FormRegistroConPin   from '../components/forms/login/FormRegistroConPin.jsx'

//IMPORTACIÓN IMPORTANTE:  Direccion de constants.js : Para el uso de direcciones
import { Direccion } from '../utils/constants.js'

/**
 * LoginPage — Pantalla de acceso unificada (Cambio #8, Sexta llamada).
 *
 * Una sola pantalla para todos:
 *   · Acceso: teléfono → el sistema decide (trabajador → QR, encargado → PIN).
 *   · Registro nuevo: PIN de autorización → alta del trabajador.
 *
 * El antiguo selector Trabajador/Encargado desaparece: el rol se detecta solo.
 */
export default function LoginPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-app-bg">
      {/*[Vinculo Global] Se usa la ruta centralizada definida en constants.js ('/central/login') */ }
      <Header rightLabel="CENTRAL" onRightClick={() => navigate(Direccion.centralLogin)} />

      <div className="px-4 pt-6 pb-6 space-y-4 max-w-md mx-auto">
        <FormAccesoUnificado />
        <FormRegistroConPin />
      </div>
    </div>
  )
}
