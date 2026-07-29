import { openDB } from 'idb'

/**
 * offline.js — Cola local en IndexedDB para escritura offline.
 *
 * El Encargado puede registrar jornadas sin conexión. Cada operación
 * se guarda en IndexedDB. Cuando la red vuelve, se vacía la cola
 * contra Supabase (ver `syncPendingOperations`).
 *
 * Estructura de la BD:
 *   DB:    estajos-offline
 *   Store: pending  (auto-incremental)
 *     { id, type, payload, createdAt }
 */

const DB_NAME = 'estajos-offline'
const STORE   = 'pending'

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

/**
 * Encola una operación para procesar al reconectar.
 *
 * @param {string} type        Identificador del API call (ej. 'registrarJornada')
 * @param {Object} payload     Argumentos del API call
 */
export async function queueOperation(type, payload) {
  const db = await getDB()
  await db.add(STORE, {
    type,
    payload,
    createdAt: Date.now()
  })
}

/**
 * Devuelve todas las operaciones pendientes.
 */
export async function getPendingOperations() {
  const db = await getDB()
  return db.getAll(STORE)
}

/**
 * Sincroniza la cola contra Supabase. `handlers` mapea tipos a funciones.
 *
 * Ejemplo:
 *   await syncPendingOperations({
 *     registrarJornada: registrarJornadaAPI
 *   })
 */
export async function syncPendingOperations(handlers) {
  const db = await getDB()
  const pending = await db.getAll(STORE)

  for (const op of pending) {
    const fn = handlers[op.type]
    if (!fn) {
      console.warn(`[offline] No hay handler para "${op.type}"`)
      continue
    }
    try {
      await fn(op.payload)
      await db.delete(STORE, op.id)
    } catch (err) {
      console.error(`[offline] Fallo al sincronizar #${op.id}`, err)
      // Se deja en la cola para reintentar
    }
  }
}

/**
 * Cantidad de operaciones aún por sincronizar.
 */
export async function countPending() {
  const db = await getDB()
  return db.count(STORE)
}
