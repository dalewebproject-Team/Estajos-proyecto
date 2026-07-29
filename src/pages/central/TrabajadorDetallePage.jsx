import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  LogOut, ArrowLeft, Edit2, X, Check, Clock, TrendingDown, Wallet,
  ChevronDown, ChevronUp, UserX, Trash2
} from 'lucide-react'

import Header        from '../../components/layout/Header.jsx'
import HorizontalNav from '../../components/layout/HorizontalNav.jsx'
import Card          from '../../components/ui/Card.jsx'
import Button        from '../../components/ui/Button.jsx'
import SectionTitle  from '../../components/ui/SectionTitle.jsx'
import Badge         from '../../components/ui/Badge.jsx'
import Modal          from '../../components/ui/Modal.jsx'
import FormTrabajador from '../../components/forms/central/FormTrabajador.jsx'
import FormAdelanto   from '../../components/forms/central/FormAdelanto.jsx'

import { useAuthStore }         from '../../store/authStore.js'
import { logout }               from '../../lib/api/auth.js'
import {
  getTrabajadorPorId,
  actualizarTrabajador,
  eliminarTrabajador,
  getBalanceTrabajador
} from '../../lib/api/workers.js'
import {
  getHistorialPagos,
  getHistorialAdelantos,
  getJornadasTrabajador,
  registrarAdelanto,
  actualizarJornadaTrabajador,
  actualizarMontoAdelantoEmpleado,
  eliminarAdelantoEmpleado,
} from '../../lib/api/records.js'
import { useRealtime } from '../../hooks/useRealtime.js'

//Importamos Direccion de constants.js  : Para el uso de direcciones
import { Direccion } from '../../utils/constants.js'


/* ─── Tarjeta de stat individual ─── */
function StatBox({ label, value, color = 'navy' }) {
  const colorMap = {
    navy:   'text-navy-dark',
    green:  'text-primary',
    danger: 'text-danger',
    gold:   'text-gold',
  }
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <p className="text-[9px] font-semibold text-gray-400 uppercase mb-1">{label}</p>
      <p className={`font-bold text-sm ${colorMap[color]}`}>{value}</p>
    </div>
  )
}

/* ─── Sección plegable ─── */
function Collapsible({ title, color = 'green', children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Card>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between"
      >
        <SectionTitle color={color} className="mb-0">{title}</SectionTitle>
        {open
          ? <ChevronUp className="w-4 h-4 text-gray-400" />
          : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="mt-4">{children}</div>}
    </Card>
  )
}

/* ═══════════════════════════════════════════
   PÁGINA PRINCIPAL
═══════════════════════════════════════════ */
export default function TrabajadorDetallePage() {
  const { id } = useParams()
  const navigate      = useNavigate()
  const { rol, clear } = useAuthStore()

  const [trabajador, setTrabajador] = useState(null)
  const [balance, setBalance]       = useState(0)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  const [pagos, setPagos]         = useState([])
  const [adelantos, setAdelantos] = useState([])
  const [jornadas, setJornadas]   = useState([])

  const [editando, setEditando]     = useState(false)
  const [formEdit, setFormEdit]     = useState({})
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError]   = useState(null)

  const [montoAdelanto, setMontoAdelanto]   = useState('')
  const [savingAdelanto, setSavingAdelanto] = useState(false)
  const [adelantoError, setAdelantoError]   = useState(null)

  const [savingRol, setSavingRol] = useState(false)
  const [rolError, setRolError]   = useState(null)

  // Cambio 1.3.7 (Octava llamada): edición de horas/destajo/fecha de una jornada
  const [editandoJornadaId, setEditandoJornadaId] = useState(null)
  const [jornadaEdit, setJornadaEdit]             = useState({ horas: '', destajo: '', fecha: '' })
  const [savingJornada, setSavingJornada]         = useState(false)
  const [jornadaError, setJornadaError]           = useState(null)

  // Cambio 1.3.9 (Octava llamada): dar de baja con confirmación en modal
  const [bajaModalOpen, setBajaModalOpen] = useState(false)
  const [savingBaja, setSavingBaja]       = useState(false)
  const [bajaError, setBajaError]         = useState(null)

  // Cambio "Opciones de Editar o Eliminar Adelantos" (octava.3): editar
  // (solo monto, fecha fija) o eliminar (borrado permanente) un adelanto
  // del ciclo activo, ambas acciones con confirmación obligatoria en modal.
  const [editandoAdelantoId, setEditandoAdelantoId] = useState(null)
  const [montoAdelantoEdit, setMontoAdelantoEdit]   = useState('')
  const [confirmAccionAdelanto, setConfirmAccionAdelanto] = useState(null) // { tipo: 'editar'|'eliminar', adelantoId, monto? }
  const [savingConfirmAdelanto, setSavingConfirmAdelanto] = useState(false)

  useEffect(() => {
    //[Vinculo Global] Se usa la ruta centralizada definida en constants.js ('/central/login')
    if (rol !== 'admin') navigate(  Direccion.centralLogin , { replace: true })
  }, [rol, navigate])

  const cargar = useCallback(async () => {
    if (!id) return
    setLoading(true); setError(null)
    try {
      const [t, b, p, a, j] = await Promise.all([
        getTrabajadorPorId(id),
        getBalanceTrabajador(id).catch(() => 0),
        getHistorialPagos(id).catch(() => []),
        getHistorialAdelantos(id).catch(() => []),
        getJornadasTrabajador(id).catch(() => []),
      ])
      setTrabajador(t)
      setBalance(b)
      setPagos(p)
      setAdelantos(a)
      setJornadas(j)
      setFormEdit({
        nombre:         t.nombre,
        telefono:       t.telefono,
        payment_period: t.payment_period,
        tarifa_hora:    t.tarifa_hora,
      })
    } catch (err) {
      setError(err.message)
    } finally { setLoading(false) }
  }, [id])

  useEffect(() => { cargar() }, [cargar])

  // Cambio 1.3.7: recálculo en tiempo real — cualquier UPDATE sobre
  // jornadas (propio o desde otra pestaña/dispositivo) recarga el detalle
  // al instante a través de Supabase Realtime, así el saldo neto y el
  // subtotal de cada día quedan siempre sincronizados.
  const onJornadaRT = useCallback((payload) => {
    if (payload.new?.empleado_id === id || payload.old?.empleado_id === id) cargar()
  }, [id, cargar])
  useRealtime('jornada_empleado', onJornadaRT, { event: 'UPDATE' })

  //[Vinculo Global] Se usa la ruta centralizada definida en constants.js (Direccion.login = '/login')
  const handleSalir = async () => { await logout(); clear(); navigate( Direccion.login ) }

  /* ── Guardar edición ── */
  const handleGuardarEdit = async () => {
    setSavingEdit(true); setEditError(null)
    try {
      await actualizarTrabajador(id, {
        nombre:         formEdit.nombre.trim(),
        telefono:       formEdit.telefono.trim(),
        payment_period: formEdit.payment_period,
        tarifa_hora:    parseFloat(formEdit.tarifa_hora) || 0,
      })
      await cargar()
      setEditando(false)
    } catch (err) { setEditError(err.message) }
    finally { setSavingEdit(false) }
  }

  /* ── Adelanto rápido ── */
  const handleAdelanto = async () => {
    if (!montoAdelanto) return
    setSavingAdelanto(true); setAdelantoError(null)
    try {
      await registrarAdelanto({ empleadoId: id, monto: parseFloat(montoAdelanto) || 0 })
      setMontoAdelanto('')
      await cargar()
    } catch (err) { setAdelantoError(err.message) }
    finally { setSavingAdelanto(false) }
  }

  /* ── Rol de encargado (Cambio #9) ── */
  const handleToggleEncargado = async () => {
    setSavingRol(true); setRolError(null)
    try {
      await actualizarTrabajador(id, { es_encargado: !trabajador.es_encargado })
      await cargar()
    } catch (err) { setRolError(err.message) }
    finally { setSavingRol(false) }
  }

  /* ── Cambio 1.3.7: guardar horas/destajo/fecha editados de una jornada ──
     Al guardar se recarga todo (jornadas + balance) para reflejar de
     inmediato el recálculo en cascada del subtotal del día y el saldo neto.
     La tarifa_aplicada (histórica) nunca se toca — solo corrige valores mal
     capturados, no reprecia el trabajo ya hecho. */
  const handleGuardarJornada = async (jornadaId, tabla) => {
    const horas   = parseFloat(jornadaEdit.horas)
    const destajo = parseFloat(jornadaEdit.destajo)
    if (Number.isNaN(horas) || horas < 0 || Number.isNaN(destajo) || destajo < 0) {
      setJornadaError('Horas y destajo deben ser números válidos (≥ 0).')
      return
    }
    if (!jornadaEdit.fecha) {
      setJornadaError('La fecha no puede quedar vacía.')
      return
    }
    setSavingJornada(true); setJornadaError(null)
    try {
      await actualizarJornadaTrabajador(jornadaId, { horas, destajo, fecha: jornadaEdit.fecha, tabla })
      setEditandoJornadaId(null)
      await cargar()
    } catch (err) { setJornadaError(err.message) }
    finally { setSavingJornada(false) }
  }

  /* ── Editar/Eliminar Adelantos: confirmar mediante el Modal de la app ──
     (A) Editar: solo el monto es editable, la fecha nunca se toca.
     (B) Eliminar: borrado permanente de la base de datos.
     En ambos casos, al terminar se recalcula al instante el total de
     adelantos del ciclo y el saldo neto del trabajador vía `cargar()`. */
  const handleConfirmarAccionAdelanto = async () => {
    if (!confirmAccionAdelanto) return
    setSavingConfirmAdelanto(true); setAdelantoError(null)
    try {
      if (confirmAccionAdelanto.tipo === 'editar') {
        await actualizarMontoAdelantoEmpleado(confirmAccionAdelanto.adelantoId, confirmAccionAdelanto.monto)
        setEditandoAdelantoId(null)
      } else {
        await eliminarAdelantoEmpleado(confirmAccionAdelanto.adelantoId)
      }
      setConfirmAccionAdelanto(null)
      await cargar()
    } catch (err) {
      setAdelantoError(err.message)
    } finally {
      setSavingConfirmAdelanto(false)
    }
  }

  /* ── Cambio 1.3.9: dar de baja (soft delete) tras confirmación ── */
  const handleDarDeBaja = async () => {
    setSavingBaja(true); setBajaError(null)
    try {
      await eliminarTrabajador(id)
      navigate(Direccion.CentralTrabajadores)
    } catch (err) {
      setBajaError(err.message)
      setSavingBaja(false)
    }
  }

  const fmtEur  = (v) => `€${Number(v ?? 0).toFixed(2)}`
  const fmtDate = (s) => s ? new Date(s).toLocaleDateString('es-ES') : '—'

  /* ─── Loading ─── */
  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg">
        <Header rightLabel="Salir" onRightClick={handleSalir} />
        <HorizontalNav />
        <div className="px-4 pt-8 max-w-md mx-auto">
          <Card><p className="text-gray-400 text-xs text-center py-8">Cargando…</p></Card>
        </div>
      </div>
    )
  }

  /* ─── Error ─── */
  if (error || !trabajador) {
    return (
      <div className="min-h-screen bg-app-bg">
        <Header rightLabel="Salir" onRightClick={handleSalir} />
        <HorizontalNav />
        <div className="px-4 pt-8 max-w-md mx-auto">
          <Card>
            <p className="text-danger text-xs text-center py-4">{error || 'Trabajador no encontrado.'}</p>
            <Button variant="outline" icon={<ArrowLeft className="w-4 h-4" />}
            
              onClick={() => navigate( Direccion.CentralTrabajadores )}>VOLVER A REGISTROS</Button> {/*[Vinculo Global] Se usa la ruta centralizada definida en constants.js ('/central/trabajadores') */}
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-app-bg">
      <Header
        rightLabel="Salir"
        rightIcon={<LogOut className="w-3 h-3" />}
        onRightClick={handleSalir}
      />
      <HorizontalNav />

      <div className="px-4 pt-4 pb-6 max-w-md mx-auto space-y-4">

        {/* ── Cambio 1.3.8 (Séptima llamada): botón de regreso al listado ──
            Visible en la parte superior, primer elemento que ve el admin.
            Un solo clic devuelve al listado de la sección Registros. */}
        <button
          onClick={() => navigate(Direccion.CentralTrabajadores)}
          className="flex items-center gap-2 text-gray-500 hover:text-navy-dark text-xs font-semibold transition-colors active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Registros
        </button>

        {/* ── Cabecera del trabajador ── */}
        <Card>
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-navy-dark font-bold text-base">{trabajador.nombre}</h2>
                <Badge variant={trabajador.payment_period} />
              </div>
              <p className="text-gray-500 text-xs mt-1">{trabajador.telefono}</p>
            </div>
            <button
              onClick={() => { setEditando((e) => !e); setEditError(null) }}
              className="ml-3 p-2 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors"
            >
              {editando ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Balance */}
          <div className={`rounded-xl p-4 mb-4 ${balance >= 0
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100'
            : 'bg-gradient-to-r from-red-50 to-rose-50 border border-red-100'}`}
          >
            <p className="text-[10px] font-semibold uppercase text-gray-400 mb-1">Saldo neto</p>
            <p className={`font-bold text-2xl ${balance >= 0 ? 'text-primary' : 'text-danger'}`}>
              {fmtEur(balance)}
            </p>
          </div>

          {/* Cambio 1.3.5 (Octava llamada): se elimina el stat de "Destajo"
              (tarifa fija) — el destajo ya no se configura como tarifa del
              trabajador, solo se registra el monto real por jornada. */}
          <div className="grid grid-cols-1 gap-3">
            <StatBox label="Tarifa/hora" value={fmtEur(trabajador.tarifa_hora)} />
          </div>
        </Card>

        {/* ── Formulario de edición ── */}
        {editando && (
          <Card>
            <SectionTitle color="gold">Editar datos</SectionTitle>
            <FormTrabajador
              modo="editar"
              values={formEdit}
              onChange={(k) => (e) => setFormEdit({ ...formEdit, [k]: e.target.value })}
              onSubmit={handleGuardarEdit}
              saving={savingEdit}
              error={editError}
              onCancel={() => { setEditando(false); setEditError(null) }}
            />
          </Card>
        )}

        {/* ── Rol de Encargado (Cambio #9) ── */}
        <Card>
          <SectionTitle color="gold">Rol de Encargado</SectionTitle>
          {rolError && <p className="text-danger text-xs mb-2">{rolError}</p>}
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-3">
              <p className="text-xs font-semibold text-navy-dark">
                {trabajador.es_encargado ? 'Es encargado' : 'No es encargado'}
              </p>
              <p className="text-[10px] text-gray-400">
                Aplica en su próximo inicio de sesión.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!!trabajador.es_encargado}
              disabled={savingRol}
              onClick={handleToggleEncargado}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                trabajador.es_encargado ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  trabajador.es_encargado ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </Card>

        {/* ── Adelanto rápido ── */}
        <Card>
          <SectionTitle color="green">Dar adelanto</SectionTitle>
          <FormAdelanto
            compact
            monto={montoAdelanto}
            onChangeMonto={(e) => setMontoAdelanto(e.target.value)}
            onSubmit={handleAdelanto}
            saving={savingAdelanto}
            error={adelantoError}
          />
        </Card>

        {/* ── Historial de adelantos — con Editar/Eliminar ──
            Solo el monto es editable (la fecha nunca se toca); eliminar
            borra el registro de forma permanente. Ambas acciones piden
            confirmación con el Modal de la app antes de ejecutarse. */}
        <Collapsible title={`Adelantos (${adelantos.length})`} color="gold" defaultOpen={adelantos.length > 0}>
          {adelantoError && <p className="text-danger text-xs mb-2">{adelantoError}</p>}
          {adelantos.length === 0 ? (
            <p className="text-gray-400 text-xs text-center py-4">Sin adelantos.</p>
          ) : (
            <div className="space-y-2">
              {adelantos.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-3 h-3 text-danger" />
                    <p className="text-xs text-gray-500">{fmtDate(a.fecha ?? a.created_at)}</p>
                  </div>
                  {editandoAdelantoId === a.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number" autoFocus value={montoAdelantoEdit}
                        onChange={(e) => setMontoAdelantoEdit(e.target.value)}
                        className="w-16 px-1 py-0.5 bg-gray-50 border border-gray-200 rounded text-xs text-right"
                      />
                      <button
                        onClick={() => {
                          const monto = parseFloat(montoAdelantoEdit)
                          if (Number.isNaN(monto) || monto <= 0) return
                          setConfirmAccionAdelanto({ tipo: 'editar', adelantoId: a.id, monto })
                        }}
                        className="text-primary"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditandoAdelantoId(null)} className="text-gray-400">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-danger">{fmtEur(a.monto)}</p>
                      <button
                        onClick={() => { setEditandoAdelantoId(a.id); setMontoAdelantoEdit(String(a.monto)) }}
                        className="text-gray-400 hover:text-navy-dark"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmAccionAdelanto({ tipo: 'eliminar', adelantoId: a.id })}
                        className="text-gray-400 hover:text-danger"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <div className="pt-2 flex justify-between">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Total adelantado</p>
                <p className="text-xs font-bold text-danger">
                  {fmtEur(adelantos.reduce((s, a) => s + Number(a.monto), 0))}
                </p>
              </div>
            </div>
          )}
        </Collapsible>

        {/* ── Jornadas recientes [Nomina actual] — Cambio 1.3.7 (Octava llamada) ──
            Solo días pendientes de pago del ciclo activo (ya lo garantiza
            getJornadasTrabajador). Cada fila tiene un botón de edición
            (Horas y Destajo); no hay eliminar aquí. El Subtotal
            (Horas × Tarifa + Destajo) se recalcula al vuelo en cada
            render, y useRealtime mantiene la vista sincronizada ante
            cualquier UPDATE de jornadas. */}
        <Collapsible title={`Nómina Actual (${jornadas.length})`} color="green" defaultOpen={false}>
          {jornadaError && <p className="text-danger text-xs mb-2">{jornadaError}</p>}
          {jornadas.length === 0 ? (
            <p className="text-gray-400 text-xs text-center py-4">Sin jornadas.</p>
          ) : (
            <div className="space-y-1">
              <div className="grid grid-cols-6 gap-1 pb-2 border-b border-gray-100">
                {['Fecha', 'Horas', 'Destajo', 'Tarifa', 'Subtotal', ''].map((h, i) => (
                  <p key={i} className="text-[9px] font-semibold text-gray-400 uppercase text-center first:text-left">{h}</p>
                ))}
              </div>
              {jornadas.map((j) => {
                const editing  = editandoJornadaId === j.id
                // La tarifa histórica (snapshot al crearse la jornada) es la
                // que de verdad se cobra — no la tarifa actual del empleado.
                const tarifa   = j.tarifa ?? Number(trabajador.tarifa_hora || 0)
                const subtotal = Number(j.horas) * tarifa + Number(j.destajo || 0)
                return (
                  <div key={j.id} className="grid grid-cols-6 gap-1 py-1.5 border-b border-gray-50 last:border-0 items-center">
                    {editing ? (
                      <input
                        type="date" value={jornadaEdit.fecha}
                        onChange={(e) => setJornadaEdit({ ...jornadaEdit, fecha: e.target.value })}
                        className="w-full px-1 py-0.5 bg-gray-50 border border-gray-200 rounded text-[9px]"
                      />
                    ) : (
                      <p className="text-[10px] text-navy-dark">{fmtDate(j.fecha ?? j.created_at)}</p>
                    )}

                    {editing ? (
                      <input
                        type="number" autoFocus value={jornadaEdit.horas}
                        onChange={(e) => setJornadaEdit({ ...jornadaEdit, horas: e.target.value })}
                        className="w-full px-1 py-0.5 bg-gray-50 border border-gray-200 rounded text-[10px] text-center"
                      />
                    ) : (
                      <p className="text-[10px] text-center text-navy-dark">{j.horas}</p>
                    )}

                    {editing ? (
                      <input
                        type="number" value={jornadaEdit.destajo}
                        onChange={(e) => setJornadaEdit({ ...jornadaEdit, destajo: e.target.value })}
                        className="w-full px-1 py-0.5 bg-gray-50 border border-gray-200 rounded text-[10px] text-center"
                      />
                    ) : (
                      <p className="text-[10px] text-center text-navy-dark">{fmtEur(j.destajo)}</p>
                    )}

                    <p className="text-[10px] text-center text-gray-400">{fmtEur(tarifa)}/h</p>

                    <p className="text-[10px] text-right font-semibold text-navy-dark">{fmtEur(subtotal)}</p>

                    {editing ? (
                      <div className="flex items-center justify-end gap-1">
                        <button disabled={savingJornada} onClick={() => handleGuardarJornada(j.id, j.tabla)} className="text-primary">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => { setEditandoJornadaId(null); setJornadaError(null) }} className="text-gray-400">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditandoJornadaId(j.id)
                          setJornadaEdit({ horas: String(j.horas), destajo: String(j.destajo), fecha: j.fecha ?? '' })
                          setJornadaError(null)
                        }}
                        className="flex justify-end text-gray-400 hover:text-navy-dark"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )
              })}
              <div className="pt-2 flex justify-between">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Total horas</p>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <p className="text-xs font-bold text-navy-dark">
                    {jornadas.reduce((s, j) => s + Number(j.horas), 0).toFixed(1)}h
                  </p>
                </div>
              </div>
            </div>
          )}
        </Collapsible>

        {/* ── Historial de pagos [Nominas anteriores ] ── */}
        <Collapsible title={`Nóminas Anteriores (${pagos.length})`} color="green" defaultOpen={false}>
          {pagos.length === 0 ? (
            <p className="text-gray-400 text-xs text-center py-4">Sin pagos registrados.</p>
          ) : (
            <div className="space-y-2">
              {pagos.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-xs text-navy-dark font-semibold">{fmtDate(p.created_at)}</p>
                    <p className="text-[10px] text-gray-400">
                      {fmtDate(p.periodo_inicio)} – {fmtDate(p.periodo_fin)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wallet className="w-3 h-3 text-primary" />
                    <p className="text-xs font-bold text-primary">{fmtEur(p.total_pagado)}</p>
                  </div>
                </div>
              ))}
              <div className="pt-2 flex justify-between">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Total pagado</p>
                <p className="text-xs font-bold text-primary">
                  {fmtEur(pagos.reduce((s, p) => s + Number(p.total_pagado), 0))}
                </p>
              </div>
            </div>
          )}
        </Collapsible>

        {/* ── Dar de baja — Cambio 1.3.9 (Octava llamada) ──
            Borrado FÍSICO (eliminarTrabajador), con confirmación obligatoria
            en modal. Aviso 2026-07-29: la FK hacia jornadas/adelantos/pagos
            es CASCADE, así que eliminarTrabajador ahora bloquea la baja si
            el trabajador tiene cualquier historial financiero, en vez de
            borrarlo. Ver mitigación en workers.js:eliminarTrabajador. */}
        <Card>
          <SectionTitle color="gold">Dar de baja</SectionTitle>
          <p className="text-gray-400 text-[10px] mb-3">
            Esta acción retira al trabajador del listado activo. 
          </p>
          <Button
            variant="outline"
            icon={<UserX className="w-4 h-4" />}
            className="!border-danger !text-danger hover:!bg-danger hover:!text-white"
            onClick={() => { setBajaError(null); setBajaModalOpen(true) }}
          >
            DAR DE BAJA
          </Button>
        </Card>

      </div>

      {/* ── Modal de confirmación — editar/eliminar adelanto ── */}
      <Modal
        open={!!confirmAccionAdelanto}
        title={confirmAccionAdelanto?.tipo === 'editar' ? 'Confirmar edición' : 'Confirmar eliminación'}
        onClose={() => { if (!savingConfirmAdelanto) setConfirmAccionAdelanto(null) }}
      >
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            {confirmAccionAdelanto?.tipo === 'editar'
              ? `¿Actualizar el monto de este adelanto a ${fmtEur(confirmAccionAdelanto?.monto ?? 0)}?`
              : '¿Eliminar este adelanto? Esta acción no se puede deshacer.'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => setConfirmAccionAdelanto(null)} disabled={savingConfirmAdelanto}>
              CANCELAR
            </Button>
            <Button variant="primary" onClick={handleConfirmarAccionAdelanto} disabled={savingConfirmAdelanto}>
              {savingConfirmAdelanto ? 'PROCESANDO…' : 'CONFIRMAR'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal de confirmación — Cambio 1.3.9 ── */}
      <Modal
        open={bajaModalOpen}
        title="Confirmar baja"
        onClose={() => { if (!savingBaja) setBajaModalOpen(false) }}
      >
        <div className="space-y-4">
          {bajaError && <p className="text-danger text-xs">{bajaError}</p>}
          <p className="text-gray-600 text-sm">
            ¿Seguro que deseas dar de baja a <strong>{trabajador.nombre}</strong>?
            Esta acción lo borra de forma <strong>permanente</strong>. Si tiene
            jornadas, adelantos o pagos registrados, la baja se bloqueará
            automáticamente hasta que exista un flujo de liquidación forzada.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => setBajaModalOpen(false)} disabled={savingBaja}>
              CANCELAR
            </Button>
            <Button
              variant="outline"
              className="!border-danger !text-danger hover:!bg-danger hover:!text-white"
              onClick={handleDarDeBaja}
              disabled={savingBaja}
            >
              {savingBaja ? 'PROCESANDO…' : 'SÍ, DAR DE BAJA'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
