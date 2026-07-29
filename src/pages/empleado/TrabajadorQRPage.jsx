import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { LogOut, QrCode } from 'lucide-react'

import Header     from '../../components/layout/Header.jsx'
import Card       from '../../components/ui/Card.jsx'
import CircleIcon from '../../components/ui/CircleIcon.jsx'
import Badge      from '../../components/ui/Badge.jsx'

import { useAuthStore } from '../../store/authStore.js'
import { logout }       from '../../lib/api/auth.js'

// IMPORTACIÓN IMPORTANTE: Direccion de constants.js : Para el uso de direcciones
import { Direccion } from '../../utils/constants.js'

/**
 * TrabajadorQRPage — Vista exclusiva del trabajador autenticado.
 *
 * Muestra el QR permanente cuyo valor es el código corto y numérico del
 * empleado (codigoCorto). Al escanearlo, el Encargado y el Panel Central
 * hacen getTrabajadorPorId(codigo) para identificar al trabajador sin
 * exponer datos sensibles.
 *
 * FIX APLICADO:
 *   - El QR ahora usa `codigoCorto` del authStore (identificador corto y
 *     numérico), con `userId` (UUID) como respaldo si aún no está disponible.
 *   - Debajo del QR se muestra el mismo código corto en texto, para que
 *     el encargado pueda introducirlo manualmente si la cámara falla.
 *   - Guard de autenticación: redirige a /login si no hay sesión activa.
 *   - Usando QRCodeSVG (renderizado SVG nativo, sin canvas, más compatible en iOS/Safari).
 */
export default function TrabajadorQRPage() {
  const navigate = useNavigate()
  const { userId, nombre, codigoCorto, rol, clear } = useAuthStore()

  // Guard: si no hay sesión o no es trabajador, redirigir al login
  useEffect(() => {
    if (!userId || rol !== 'trabajador') {
      navigate(Direccion.login, { replace: true })
    }
  }, [userId, rol, navigate])

  const handleSalir = async () => {
    await logout()
    clear()
    navigate(Direccion.login)
  }

  // Mientras redirige, no renderizar nada
  if (!userId || rol !== 'trabajador') return null

  return (
    <div className="min-h-screen bg-app-bg">
      <Header
        rightLabel="Salir"
        rightIcon={<LogOut className="w-3 h-3" />}
        onRightClick={handleSalir}
      />

      <div className="px-4 pt-8 pb-6 max-w-md mx-auto space-y-4">
        <Card>
          {/* Encabezado del trabajador */}
          <div className="flex flex-col items-center mb-6">
            <CircleIcon icon={QrCode} size="xl" shape="square" />
            <h2 className="text-navy-dark font-bold text-base uppercase mt-4">
              {nombre}
            </h2>
            <Badge variant="custom" bg="bg-gray-100" text="text-gray-600">
              Trabajador
            </Badge>
          </div>

          {/* QR — valor = código corto numérico del empleado (respaldo: UUID) */}
          <div className="flex justify-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <QRCodeSVG
              value={codigoCorto != null ? String(codigoCorto) : userId}
              size={220}
              bgColor="#ffffff"
              fgColor="#1a2332"   // navy-dark
              level="M"           // corrección de error media: buen equilibrio tamaño/robustez
              includeMargin={true}
            />
          </div>


          {/* Código corto en texto, para entrada manual si falla la cámara */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 text-center uppercase tracking-wide mb-1">
              Código de empleado
            </p>
            <p className="text-2xl font-mono font-bold text-navy-dark text-center tracking-widest select-all">
              {codigoCorto != null ? codigoCorto : '—'}
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
