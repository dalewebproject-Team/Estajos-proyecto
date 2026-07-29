/**
 * constants.js — Valores fijos del dominio.
 */



/* ─── Periodicidades de pago ─────────────────────────────── */
/**
 * Valores internos de periodicidad. Se usan en la base de datos y en
 * comparaciones de lógica. No mostrar directamente al usuario.
 *
 * Uso:
 *   if (trabajador.payment_period === PAYMENT_PERIODS.MENSUAL) { ... }
 */
export const PAYMENT_PERIODS = {
  MENSUAL:   'mensual',
  QUINCENAL: 'quincenal',
  DIARIO:    'diario'
}



/**
 * Etiquetas legibles para mostrar en la UI.
 * Indexadas por el valor interno de PAYMENT_PERIODS.
 *
 * Uso:
 *   <Badge>{PAYMENT_PERIOD_LABELS[trabajador.payment_period]}</Badge>
 *   // → "Mensual" / "Quincenal" / "Diario"
 */
export const PAYMENT_PERIOD_LABELS = {
  mensual:   'Mensual',
  quincenal: 'Quincenal',
  diario:    'Diario'
}



/* ─── Roles del sistema ──────────────────────────────────── */
/**
 * Roles de usuario del sistema. Se almacenan en Zustand (authStore)
 * y se usan para guards de ruta y control de acceso.
 *
 * Uso:
 *   if (rol === ROLES.ENCARGADO) navigate(Direccion.seccionEncargado)
 */
export const ROLES = {
  ADMIN:      'admin',
  ENCARGADO:  'encargado',
  TRABAJADOR: 'trabajador'
}



/* ─── Configuración de la app ────────────────────────────── */
/**
 * Parámetros globales de configuración. Cambiar aquí afecta a toda la app.
 * No hardcodear estos valores en componentes o páginas.
 */
export const APP_CONFIG = {
  /** Retención de datos operativos (días) antes de purga */
  RETENTION_DAYS: 60,
  /** Frecuencia de rotación de PIN de furgoneta (horas) */
  PIN_ROTATION_HOURS: 24,
  /** Ancho máximo del contenedor móvil (px) */
  MAX_MOBILE_WIDTH: 400,
  /** Moneda */
  CURRENCY: 'EUR',
  CURRENCY_SYMBOL: '€'
}



/* ─── Rutas (centralizadas para evitar errores) ──────────── */
//En dado que se requiera agregar una pagina; En esta seccion se agrega el link
/**
 * Objeto con todas las rutas de la app. Usar SIEMPRE estas claves en
 * navigate(), <Link> y <Route> en lugar de strings literales.
 *
 * Ventaja: si se renombra una ruta, solo hay que cambiarla aquí.
 *
 * Uso:
 *   import { Direccion } from '../utils/constants.js'
 *   navigate(Direccion.login)
 *   <Route path={Direccion.centralEscanear} element={<EscanearPage />} />
 *
 * Para agregar una nueva página:
 *   1. Añadir la entrada aquí con su comentario.
 *   2. Registrar la ruta en App.jsx usando esta clave.
 *   3. Actualizar la tabla del README de src/utils/.
 */
export const Direccion = {
  login: '/login',                                      // Para: LoginPage
  centralLogin: '/central/login',                       // para: CentralLoginPage
  trabajadorQr: '/trabajador/qr',                       // para: ParabajadorQRPage
  encargadoPin: '/encargado/pin',                       // para: IngresarPinFurgonetaPage (login unificado #8)
  encargadoPlaza: '/encargado/plaza',                   // para: IngresarPlazaFurgonetaPage //Nueva pagina
  seccionEncargado: '/encargado/controlEncargado',      // para: SeccionEncargadoPage
  centralEscanear: '/central/escanear',                 // para: EscanearPage
  centralReporte: '/central/reporte',                   // para: ReporteDiarioPage
  CentralTrabajadores: '/central/trabajadores',         // para: TrabajadoresPage
  CentralVehiculos: '/central/vehiculos',               // para: VehiculosPage
  CentralVehiculosID: '/central/vehiculos/:id',         // para: VehiculoDetallePage
  CentralResumen: '/central/resumen',                   // para: ResumenPage
  CentralTrabajadoresID: '/central/trabajadores/:id',   // para: TrabajadorDetallePage
  CentralConfiguracion: '/central/configuracion',       // para: ConfiguracionPage
};
