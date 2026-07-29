import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/**
 * authStore — Estado global de sesión.
 *
 * rol: 'trabajador' | 'encargado' | 'admin' | null
 */
export const useAuthStore = create()(
  persist(
    (set) => ({
      rol: null,
      userId: null,
      nombre: null,
      codigoCorto: null,
      vehiculoActivoId: null,
      vehiculoActivoNombre: null,

      setAuth: (payload) => set(payload),
      clear: () => set({
        rol: null, userId: null, nombre: null, codigoCorto: null,
        vehiculoActivoId: null, vehiculoActivoNombre: null
      })
    }),
    {
      name: 'estajos-auth',
      storage: createJSONStorage(() => localStorage),

      // FIX (Cambio 7 — Quinta Reunión 09/06/2026):
      // La sesión del encargado (incluido el vehículo/PIN activo) nunca
      // se restaura desde almacenamiento persistente. Si se cierra la app
      // o se recarga la página estando logueado como encargado, al volver
      // a abrirla la sesión aparece vacía y debe iniciar sesión de nuevo
      // introduciendo el PIN del vehículo. Trabajador y admin sí mantienen
      // su sesión entre recargas.
      partialize: (state) =>
        state.rol === 'encargado'
          ? {
              rol: null, userId: null, nombre: null, codigoCorto: null,
              vehiculoActivoId: null, vehiculoActivoNombre: null
            }
          : state
    }
  )
)
