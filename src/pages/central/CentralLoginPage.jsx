import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'

import Header     from '../../components/layout/Header.jsx'
import Card       from '../../components/ui/Card.jsx'
import Input      from '../../components/ui/Input.jsx'
import Button     from '../../components/ui/Button.jsx'
import CircleIcon from '../../components/ui/CircleIcon.jsx'

import { loginAdmin } from '../../lib/api/auth.js'
import { useAuthStore } from '../../store/authStore.js'

//IMPORTACIÓN IMPORTANTE:  Direccion de constants.js : Para el uso de direcciones
import { Direccion } from '../../utils/constants.js'

export default function CentralLoginPage() {
  const navigate = useNavigate()
  const setAuth  = useAuthStore((s) => s.setAuth)
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState(null)
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null); setLoading(true)
    try {
      const { user } = await loginAdmin(email.trim(), password)
      setAuth({ rol: 'admin', userId: user.id, nombre: user.email })

      //[Vinculo Global] Se usa la ruta centralizada definida en constants.js ('/central/escanear')
      navigate( Direccion.centralEscanear )
    } catch (err) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-app-bg">

      {/*[Vinculo Global] Se usa la ruta centralizada definida en constants.js  (Direccion.login = '/login')*/}
      <Header rightLabel="VOLVER" onRightClick={() => navigate( Direccion.login )} />

      <div className="px-4 pt-8 pb-6 max-w-md mx-auto">
        <Card>
          <div className="flex flex-col items-center mb-6">
            <CircleIcon icon={Lock} size="xl" shape="square" />
            <h2 className="text-navy-dark font-bold text-base uppercase mt-4">Panel Central</h2>
            <p className="text-gray-500 text-xs text-center mt-1">Acceso de Administrador.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <p className="text-danger text-xs text-center font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Email" type="email" placeholder="admin@empresa.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Contraseña" type="password" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'ENTRANDO…' : 'ENTRAR'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
