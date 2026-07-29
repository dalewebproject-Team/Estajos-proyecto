import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'

import App from './App.jsx'
import './index.css'

/* ─── Registro del Service Worker (PWA) ─────────────────── */
registerSW({
  onOfflineReady() {
    console.info('[PWA] App lista para usar sin conexión')
  },
  onRegisterError(err) {
    console.error('[PWA] Error al registrar SW:', err)
  }
})

/* ─── Render ────────────────────────────────────────────── */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
