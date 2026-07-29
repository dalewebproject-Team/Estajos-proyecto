import { useEffect, useState } from 'react'

/**
 * useOnlineStatus — Devuelve `true` si el navegador detecta conexión.
 *
 * Útil para:
 *   · Mostrar un banner "offline"
 *   · Activar el modo de cola local en `lib/offline.js`
 *   · Disparar la sincronización al reconectar
 *
 * Uso:
 *   const online = useOnlineStatus()
 *   if (!online) return <BannerOffline />
 */
export function useOnlineStatus() {
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  useEffect(() => {
    const goOnline  = () => setOnline(true)
    const goOffline = () => setOnline(false)

    window.addEventListener('online',  goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online',  goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return online
}
