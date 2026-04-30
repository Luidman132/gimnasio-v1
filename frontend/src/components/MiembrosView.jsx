import { useState, useRef, useEffect } from 'react'
import { Search, UserPlus, ChevronRight, ArrowLeft, UserCircle, Phone, Mail, ShieldAlert, CalendarDays, CreditCard, CheckCircle, X, QrCode, Download, Edit2, Save, Trash2 } from 'lucide-react'
import QRCode from 'react-qr-code'
import { toPng } from 'html-to-image'
import { useGym } from '../context/GymContext'
import { useToast } from '../context/ToastContext'
import { CurrencyInput } from './CurrencyInput'


const estadoBadge = {
  activo: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20',
  pase_activo: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20',
  vencido: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20',
  inactivo: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
  congelado: 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20',
}

const estadoTexto = {
  activo: 'Activo',
  pase_activo: 'Pase Activo',
  vencido: 'Vencido',
  inactivo: 'Inactivo',
  congelado: 'Congelado',
}

export default function MiembrosView({ usuario, setVistaActiva, miembroPreSeleccionado, setMiembroPreSeleccionado }) {
  const { miembros, planes, configuracion, actualizarMiembro, agregarRegistro, renovarMiembro, eliminarMiembro } = useGym()
  const { mostrarToast } = useToast()
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [ordenarPor, setOrdenarPor] = useState('alfabetico')
  const [miembroViendo, setMiembroViendo] = useState(null)

  // Deep link: si viene un miembro pre-seleccionado desde el Dashboard, abrir su perfil
  useEffect(() => {
    if (miembroPreSeleccionado) {
      setMiembroViendo(miembroPreSeleccionado)
      setMiembroPreSeleccionado?.(null)
    }
  }, [miembroPreSeleccionado, setMiembroPreSeleccionado])

  // Resumen de operación (Renovación / Pase)
  const [resumenOperacion, setResumenOperacion] = useState(null)
  const [mostrarModalQR, setMostrarModalQR] = useState(false)
  const qrRef = useRef(null)

  // Modales
  const [mostrarModalRenovacion, setMostrarModalRenovacion] = useState(false)
  const [renovarPlan, setRenovarPlan] = useState('')
  const [renovarMonto, setRenovarMonto] = useState('')

  const [mostrarModalPase, setMostrarModalPase] = useState(false)
  const [diasPase, setDiasPase] = useState(1)

  // Modo edición de perfil
  const [modoEdicion, setModoEdicion] = useState(false)
  const [editNombre, setEditNombre] = useState('')
  const [editDni, setEditDni] = useState('')
  const [editCelular, setEditCelular] = useState('')
  const [editCorreo, setEditCorreo] = useState('')
  const [editContactoNombre, setEditContactoNombre] = useState('')
  const [editContactoTelefono, setEditContactoTelefono] = useState('')
  const [editEstado, setEditEstado] = useState('activo')
  const [editTurno, setEditTurno] = useState('')
  const [guardandoEdicion, setGuardandoEdicion] = useState(false)

  function iniciarEdicion() {
    setEditNombre(miembroViendo.nombre || '')
    setEditDni(miembroViendo.dni || '')
    setEditCelular(miembroViendo.celular || '')
    setEditCorreo(miembroViendo.email || '')
    setEditContactoNombre(miembroViendo.contactoNombre || '')
    setEditContactoTelefono(miembroViendo.contactoTelefono || '')
    setEditEstado(miembroViendo.estado || 'activo')
    setEditTurno(miembroViendo.turno || '')
    setModoEdicion(true)
  }

  function cancelarEdicion() {
    setModoEdicion(false)
  }

  async function guardarEdicion() {
    if (!editNombre.trim() || !editDni.trim()) {
      mostrarToast('Nombre y DNI son obligatorios', 'error')
      return
    }
    setGuardandoEdicion(true)
    const cambios = {
      nombre: editNombre.trim(),
      dni: editDni.trim(),
      celular: editCelular.trim() || undefined,
      email: editCorreo.trim() || undefined,
      contactoNombre: editContactoNombre.trim() || undefined,
      contactoTelefono: editContactoTelefono.trim() || undefined,
      estado: editEstado,
      turno: editTurno || undefined,
    }
    await actualizarMiembro(miembroViendo.id, cambios)
    setMiembroViendo(prev => ({ ...prev, ...cambios }))
    setModoEdicion(false)
    setGuardandoEdicion(false)
    mostrarToast('Perfil actualizado correctamente')
  }
  const [montoPase, setMontoPase] = useState('')

  const planesActivos = planes.filter(p => p.activo)

  function formatFechaISO(date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  async function confirmarRenovacion() {
    const planObj = planesActivos.find(p => String(p.id) === String(renovarPlan))
    if (!planObj) return

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const fechaFin = new Date(hoy)
    fechaFin.setDate(fechaFin.getDate() + (planObj.duracionDias || 30))

    const fechaInicioStr = formatFechaISO(hoy)
    const fechaFinStr = formatFechaISO(fechaFin)
    const montoFinal = renovarMonto || String(planObj.precio.toFixed(2))

    await renovarMiembro(miembroViendo.id, {
      plan: planObj.nombre,
      planLabel: planObj.nombre,
      fechaInicio: fechaInicioStr,
      fechaFin: fechaFinStr,
      monto: montoFinal,
      nombreMiembro: miembroViendo.nombre,
    })

    // Actualizar vista local y abrir resumen
    const cambios = { estado: 'activo', plan: planObj.nombre, inicio: fechaInicioStr, fin: fechaFinStr }
    setMiembroViendo(prev => ({ ...prev, ...cambios }))
    setMostrarModalRenovacion(false)

    setResumenOperacion({
      tipo: 'renovacion',
      nombre: miembroViendo.nombre,
      dni: miembroViendo.dni,
      celular: miembroViendo.celular,
      email: miembroViendo.email,
      contactoNombre: miembroViendo.contactoNombre,
      contactoTelefono: miembroViendo.contactoTelefono,
      plan: planObj.nombre,
      duracion: planObj.duracion,
      inicio: fechaInicioStr,
      fin: fechaFinStr,
      monto: montoFinal,
      qrToken: miembroViendo.qrToken,
    })
  }

  function confirmarPase() {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const fechaFin = new Date(hoy)
    fechaFin.setDate(fechaFin.getDate() + diasPase)

    const cambios = {
      estado: 'pase_activo',
      plan: 'Pase Dia',
      diasRestantes: diasPase,
      inicio: formatFechaISO(hoy),
      fin: formatFechaISO(fechaFin),
    }

    // 1. Actualizar estado global del miembro
    actualizarMiembro(miembroViendo.id, cambios)

    // 2. Registrar el cobro en el historial
    agregarRegistro({
      tipo: 'cobro',
      titulo: `Pase Día - ${miembroViendo.nombre}`,
      detalle: `Cobro pase ${diasPase} día(s): S/ ${montoPase}. Cliente: ${miembroViendo.nombre}`,
      miembroId: miembroViendo.id,
    })

    // 3. Actualizar vista local
    const miembroActualizado = { ...miembroViendo, ...cambios }
    setMiembroViendo(miembroActualizado)
    setMostrarModalPase(false)

    // 4. Abrir Resumen de Operación
    setResumenOperacion({
      tipo: 'pase',
      nombre: miembroViendo.nombre,
      dni: miembroViendo.dni,
      celular: miembroViendo.celular,
      email: miembroViendo.email,
      plan: `Pase por ${diasPase} día(s)`,
      inicio: cambios.inicio,
      fin: cambios.fin,
      diasRestantes: diasPase,
      monto: montoPase,
      qrToken: miembroViendo.qrToken,
    })
  }

  const registrarAsistenciaNormal = () => {
    agregarRegistro({
      tipo: 'asistencia',
      titulo: `Asistencia - ${miembroViendo.nombre}`,
      detalle: `Entrada registrada: ${miembroViendo.nombre}`,
      miembroId: miembroViendo.id,
    })
    mostrarToast(`Asistencia registrada: ${miembroViendo.nombre}`)
    setMiembroViendo(null)
  }

  const descontarPase = () => {
    if (!miembroViendo || miembroViendo.estado !== 'pase_activo') return

    const diasRestantes = (miembroViendo.diasRestantes || 1) - 1
    const cambios = diasRestantes > 0
      ? { diasRestantes }
      : { estado: 'vencido', diasRestantes: 0 }

    // Actualizar estado global
    actualizarMiembro(miembroViendo.id, cambios)

    // Registrar asistencia en historial
    agregarRegistro({
      tipo: 'asistencia',
      titulo: `Pase Día - ${miembroViendo.nombre}`,
      detalle: `Entrada con pase (${diasRestantes} día${diasRestantes !== 1 ? 's' : ''} restante${diasRestantes !== 1 ? 's' : ''}): ${miembroViendo.nombre}`,
      miembroId: miembroViendo.id,
    })

    if (diasRestantes > 0) {
      mostrarToast(`Pase descontado. Le quedan ${diasRestantes} día${diasRestantes > 1 ? 's' : ''} a ${miembroViendo.nombre}`)
    } else {
      mostrarToast(`Pase agotado. El pase de ${miembroViendo.nombre} ha terminado.`, 'info')
    }

    setMiembroViendo(null)
  }

  const descargarQR = async () => {
    if (!qrRef.current || !miembroViendo) return
    try {
      const dataUrl = await toPng(qrRef.current, {
        quality: 1.0,
        pixelRatio: 3,
        backgroundColor: '#ffffff',
      })
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `Pase_QR_${miembroViendo.nombre.replace(/\s+/g, '_')}.png`
      link.click()
    } catch (err) {
      console.error('Error al descargar QR:', err)
      alert('Hubo un error al descargar el código QR.')
    }
  }

  const normalizar = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

  const parseFechaDDMMYYYY = (fechaStr) => {
    if (!fechaStr) return 0
    const partes = fechaStr.split('/')
    if (partes.length !== 3) return 0
    return new Date(partes[2], partes[1] - 1, partes[0]).getTime()
  }

  const miembrosFiltrados = miembros
    .filter(m => {
      if (filtroEstado !== 'todos' && m.estado !== filtroEstado) return false
      if (busqueda.trim().length > 1) {
        const query = normalizar(busqueda.trim())
        const terminos = query.split(/\s+/)
        const nombreNorm = normalizar(m.nombre)
        const dniNorm = m.dni || ''
        return terminos.every(t => nombreNorm.includes(t) || dniNorm.includes(t))
      }
      return true
    })
    .sort((a, b) => {
      if (ordenarPor === 'alfabetico') return a.nombre.localeCompare(b.nombre)
      if (ordenarPor === 'fecha_reciente') return parseFechaDDMMYYYY(b.inicio) - parseFechaDDMMYYYY(a.inicio)
      if (ordenarPor === 'fecha_antigua') return parseFechaDDMMYYYY(a.inicio) - parseFechaDDMMYYYY(b.inicio)
      return 0
    })

  const totalActivos = miembros.filter(m => m.estado === 'activo').length
  const totalPases = miembros.filter(m => m.estado === 'pase_activo').length
  const totalVencidos = miembros.filter(m => m.estado === 'vencido').length

  // ── Vista Detalle (Ficha de Perfil) ──
  if (miembroViendo) {
    return (
      <>
        <div className="p-8 space-y-6">
          {/* Botón Volver */}
          <button
            onClick={() => setMiembroViendo(null)}
            className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
            Volver al Directorio
          </button>

          {/* Cabecera del Perfil */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm dark:shadow-none border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center shrink-0">
                <UserCircle size={48} className="text-slate-400 dark:text-slate-500" />
              </div>
              <div>
                {modoEdicion ? (
                  <div className="space-y-2">
                    <input type="text" value={editNombre} onChange={e => setEditNombre(e.target.value)} placeholder="Nombre completo" className="text-xl font-bold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 outline-none focus:border-blue-400 dark:focus:border-blue-500 w-full" />
                    <input type="text" value={editDni} onChange={e => setEditDni(e.target.value)} placeholder="DNI" className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 outline-none focus:border-blue-400 dark:focus:border-blue-500 w-full font-mono" />
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{miembroViendo.nombre}</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">DNI: {miembroViendo.dni}</p>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
              {!modoEdicion ? (
                <>
                  <button
                    onClick={iniciarEdicion}
                    className="flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 px-4 py-2.5 rounded-xl font-medium transition-colors text-sm shadow-sm cursor-pointer"
                  >
                    <Edit2 size={16} />
                    Editar Perfil
                  </button>
                  <button
                    onClick={() => setMostrarModalQR(true)}
                    className="flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl font-medium transition-colors text-sm shadow-sm cursor-pointer"
                  >
                    <QrCode size={18} className="text-emerald-600 dark:text-emerald-400" />
                    Ver QR
                  </button>
                  {usuario?.rol?.toLowerCase() === 'admin' && (
                    <button
                      onClick={async () => {
                        if (!window.confirm(`¿Estás seguro de que deseas eliminar a ${miembroViendo.nombre}? Esta acción no se puede deshacer.`)) return
                        const res = await eliminarMiembro(miembroViendo.id)
                        if (res.success) {
                          setMiembroViendo(null)
                          mostrarToast('Miembro eliminado correctamente')
                        } else {
                          mostrarToast(res.mensaje || 'Error al eliminar miembro', 'error')
                        }
                      }}
                      className="flex items-center justify-center gap-2 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 px-4 py-2.5 rounded-xl font-medium transition-colors text-sm shadow-sm cursor-pointer"
                    >
                      <Trash2 size={16} />
                      Eliminar
                    </button>
                  )}
                  <span className={`px-4 py-2 text-sm font-bold rounded-full ${estadoBadge[miembroViendo.estado]}`}>
                    {estadoTexto[miembroViendo.estado]}
                  </span>
                </>
              ) : (
                <>
                  <button
                    onClick={guardarEdicion}
                    disabled={guardandoEdicion}
                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors text-sm shadow-sm cursor-pointer"
                  >
                    <Save size={16} />
                    {guardandoEdicion ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                  <button
                    onClick={cancelarEdicion}
                    className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-5 py-2.5 rounded-xl font-medium transition-colors text-sm cursor-pointer"
                  >
                    Cancelar
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Cuadrícula de Información */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tarjeta Info de Contacto */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm dark:shadow-none border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
                Información de Contacto
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg shrink-0">
                    <Phone size={16} className="text-slate-400 dark:text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Celular</span>
                    {modoEdicion ? (
                      <input type="text" value={editCelular} onChange={e => setEditCelular(e.target.value)} placeholder="Ej: +51 999888777" className="w-full text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 outline-none focus:border-blue-400 dark:focus:border-blue-500 mt-1" />
                    ) : (
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{miembroViendo.celular || 'No registrado'}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg shrink-0">
                    <Mail size={16} className="text-slate-400 dark:text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Correo Electrónico</span>
                    {modoEdicion ? (
                      <input type="email" value={editCorreo} onChange={e => setEditCorreo(e.target.value)} placeholder="correo@ejemplo.com" className="w-full text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 outline-none focus:border-blue-400 dark:focus:border-blue-500 mt-1" />
                    ) : (
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{miembroViendo.email || 'No registrado'}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3 pt-2 border-t border-slate-50 dark:border-slate-800">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg shrink-0">
                    <ShieldAlert size={16} className="text-slate-400 dark:text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Contacto de Emergencia</span>
                    {modoEdicion ? (
                      <div className="space-y-2 mt-1">
                        <input type="text" value={editContactoNombre} onChange={e => setEditContactoNombre(e.target.value)} placeholder="Nombre del contacto" className="w-full text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 outline-none focus:border-blue-400 dark:focus:border-blue-500" />
                        <input type="text" value={editContactoTelefono} onChange={e => setEditContactoTelefono(e.target.value)} placeholder="Teléfono del contacto" className="w-full text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 outline-none focus:border-blue-400 dark:focus:border-blue-500" />
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {miembroViendo.contactoNombre || 'No registrado'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {miembroViendo.contactoTelefono || 'N/A'}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                {modoEdicion && (
                  <div className="pt-3 border-t border-slate-50 dark:border-slate-800 grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Estado</span>
                      <select value={editEstado} onChange={e => setEditEstado(e.target.value)} className="w-full text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 outline-none focus:border-blue-400 dark:focus:border-blue-500">
                        <option value="activo">Activo</option>
                        <option value="vencido">Vencido</option>
                        <option value="pase_activo">Pase Activo</option>
                        <option value="inactivo">Inactivo</option>
                        <option value="congelado">Congelado</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Turno preferido</span>
                      <select value={editTurno} onChange={e => setEditTurno(e.target.value)} className="w-full text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 outline-none focus:border-blue-400 dark:focus:border-blue-500">
                        <option value="">Sin turno</option>
                        <option value="mañana">Mañana</option>
                        <option value="tarde">Tarde</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tarjeta Suscripción */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm dark:shadow-none border border-slate-200 dark:border-slate-800 flex flex-col">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
                Suscripción Actual
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5 flex-1">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg shrink-0">
                    <CreditCard size={16} className="text-slate-400 dark:text-slate-500" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Plan</span>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{miembroViendo.plan}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg shrink-0">
                    <CalendarDays size={16} className="text-slate-400 dark:text-slate-500" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Inicio</span>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{miembroViendo.inicio || '14/02/2026'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg shrink-0">
                    <CalendarDays size={16} className="text-slate-400 dark:text-slate-500" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Vencimiento</span>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{miembroViendo.fin || '—'}</p>
                  </div>
                </div>
                {miembroViendo.estado === 'pase_activo' && (
                  <div className="col-span-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl p-3">
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Días restantes de pase</span>
                    <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{miembroViendo.diasRestantes}</p>
                  </div>
                )}
                {miembroViendo.turno && (
                  <div className="col-span-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Turno preferido</span>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 capitalize">{miembroViendo.turno}</p>
                  </div>
                )}
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                {miembroViendo.estado === 'activo' && (
                  <button
                    onClick={registrarAsistenciaNormal}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <CheckCircle size={20} /> Registrar Asistencia de Hoy
                  </button>
                )}

                {miembroViendo.estado === 'vencido' && (
                  <>
                    <button
                      onClick={() => {
                        const primerPlan = planesActivos[0]
                        setRenovarPlan(primerPlan ? String(primerPlan.id) : '')
                        setRenovarMonto(primerPlan ? String(primerPlan.precio.toFixed(2)) : '')
                        setMostrarModalRenovacion(true)
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                      <CreditCard size={20} /> Cobrar Renovación
                    </button>
                    <button
                      onClick={() => { setDiasPase(1); setMontoPase(''); setMostrarModalPase(true) }}
                      className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 font-semibold py-3 rounded-xl transition-colors"
                    >
                      Vender Pase por Día
                    </button>
                  </>
                )}

                {miembroViendo.estado === 'pase_activo' && (
                  <button
                    onClick={descontarPase}
                    className="w-full bg-[#ff8c00] hover:bg-[#e67e00] text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <CheckCircle size={20} /> Descontar 1 Día de Pase
                  </button>
                )}

              </div>
            </div>
          </div>
        </div>

        {/* MODAL DE CÓDIGO QR */}
        {mostrarModalQR && miembroViendo && (
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-4xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col text-center">

              {/* Cabecera del modal */}
              <div className="p-4 flex justify-between items-center border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-800">Pase de Ingreso</h3>
                <button onClick={() => { setMostrarModalQR(false); setResumenOperacion(null) }} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 shadow-sm cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              {/* Contenedor del QR (Este es el que se descarga) */}
              <div className="p-8 flex flex-col items-center justify-center bg-white" ref={qrRef}>
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-xl shadow-sm border border-emerald-200 mb-4">
                  TR
                </div>
                <h2 className="font-black text-slate-800 text-lg leading-tight tracking-tight mb-1">{miembroViendo.nombre}</h2>
                <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-6">ID: {miembroViendo.qrToken || 'SIN-CODIGO'}</p>

                {/* El Código QR */}
                <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm inline-block">
                  {miembroViendo.qrToken ? (
                    <QRCode value={miembroViendo.qrToken} size={180} level="H" />
                  ) : (
                    <div className="w-45 h-45 flex items-center justify-center bg-slate-50 text-slate-400 text-sm">Sin código asignado</div>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-4">{configuracion.nombre_gimnasio} {configuracion.mensaje_ticket && `- ${configuracion.mensaje_ticket}`}</p>
              </div>

              {/* Botón de Descarga */}
              <div className="p-4 bg-slate-50 border-t border-slate-100">
                <button
                  onClick={descargarQR}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                >
                  <Download size={18} /> Descargar Imagen QR
                </button>
              </div>

            </div>
          </div>
        )}

        {/* MODAL RENOVACIÓN */}
        {mostrarModalRenovacion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-transparent dark:border-slate-800">
              <div className="bg-blue-50 dark:bg-blue-500/10 p-6 flex items-center justify-between border-b border-blue-100 dark:border-blue-500/20">
                <div>
                  <h3 className="text-lg font-bold text-blue-800 dark:text-blue-300">Cobrar Renovación</h3>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">{miembroViendo.nombre}</p>
                </div>
                <button onClick={() => setMostrarModalRenovacion(false)} className="p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-400 dark:text-blue-500 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Elegir Nuevo Plan</label>
                  <select
                    value={renovarPlan}
                    onChange={(e) => {
                      setRenovarPlan(e.target.value)
                      const planObj = planesActivos.find(p => String(p.id) === e.target.value)
                      if (planObj) setRenovarMonto(String(planObj.precio.toFixed(2)))
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-3 px-4 text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400 dark:focus:border-blue-500"
                  >
                    {planesActivos.map(p => (
                      <option key={p.id} value={String(p.id)}>
                        {p.nombre} — {p.duracion} — S/ {p.precio.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Monto Recibido</label>
                  <CurrencyInput value={renovarMonto} onChange={setRenovarMonto} />
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
                <button onClick={() => setMostrarModalRenovacion(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  Cancelar
                </button>
                <button onClick={confirmarRenovacion} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm">
                  Confirmar y Cobrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL PASE POR DÍA */}
        {mostrarModalPase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-transparent dark:border-slate-800">
              <div className="bg-slate-50 dark:bg-slate-800 p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Vender Pase Temporal</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{miembroViendo.nombre}</p>
                </div>
                <button onClick={() => setMostrarModalPase(false)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-3">Cantidad de días</label>
                  <div className="flex gap-3">
                    {[1, 2, 3].map((n) => (
                      <button
                        key={n}
                        onClick={() => setDiasPase(n)}
                        className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${diasPase === n
                          ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-md'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                      >
                        {n} Día{n > 1 ? 's' : ''}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Monto Recibido</label>
                  <CurrencyInput value={montoPase} onChange={setMontoPase} />
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button onClick={() => setMostrarModalPase(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  Cancelar
                </button>
                <button onClick={confirmarPase} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-slate-800 dark:bg-slate-200 dark:text-slate-900 hover:bg-slate-900 dark:hover:bg-slate-300 transition-colors shadow-sm">
                  Registrar Venta
                </button>
              </div>
            </div>
          </div>
        )}
        {/* MODAL RESUMEN DE OPERACIÓN (Paso 1: Resumen detallado) */}
        {resumenOperacion && !mostrarModalQR && (
          <div className="fixed inset-0 z-90 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-4xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-transparent dark:border-slate-800 max-h-[90vh]">

              {/* Cabecera */}
              <div className="p-6 bg-linear-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 border-b border-slate-100 dark:border-slate-800 text-center relative shrink-0">
                <button
                  onClick={() => setResumenOperacion(null)}
                  className="absolute top-4 right-4 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 bg-white dark:bg-slate-800 rounded-full p-1 shadow-sm cursor-pointer transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle size={36} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  {resumenOperacion.tipo === 'renovacion' ? '¡Renovación Exitosa!' : '¡Pase Registrado!'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Verifica los datos antes de generar el pase</p>
              </div>

              {/* Contenido scrolleable */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1">

                {/* Datos Personales */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Datos del Miembro</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-slate-400 dark:text-slate-500 text-xs">Nombre</span><p className="font-semibold text-slate-800 dark:text-slate-100">{resumenOperacion.nombre}</p></div>
                    <div><span className="text-slate-400 dark:text-slate-500 text-xs">DNI</span><p className="font-semibold text-slate-800 dark:text-slate-100">{resumenOperacion.dni}</p></div>
                    {resumenOperacion.celular && <div><span className="text-slate-400 dark:text-slate-500 text-xs">Celular</span><p className="font-semibold text-slate-800 dark:text-slate-100">{resumenOperacion.celular}</p></div>}
                    {resumenOperacion.email && <div><span className="text-slate-400 dark:text-slate-500 text-xs">Email</span><p className="font-semibold text-slate-800 dark:text-slate-100">{resumenOperacion.email}</p></div>}
                  </div>
                </div>

                {/* Contacto de Emergencia (solo si hay) */}
                {resumenOperacion.contactoNombre && (
                  <div className="bg-amber-50 dark:bg-amber-500/10 rounded-2xl p-4 border border-amber-100 dark:border-amber-500/20">
                    <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-3">Contacto de Emergencia</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-amber-500 dark:text-amber-400/60 text-xs">Nombre</span><p className="font-semibold text-slate-800 dark:text-slate-100">{resumenOperacion.contactoNombre}</p></div>
                      {resumenOperacion.contactoTelefono && <div><span className="text-amber-500 dark:text-amber-400/60 text-xs">Teléfono</span><p className="font-semibold text-slate-800 dark:text-slate-100">{resumenOperacion.contactoTelefono}</p></div>}
                    </div>
                  </div>
                )}

                {/* Plan y Fechas */}
                <div className="bg-blue-50 dark:bg-blue-500/10 rounded-2xl p-4 border border-blue-100 dark:border-blue-500/20">
                  <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">
                    {resumenOperacion.tipo === 'renovacion' ? 'Nuevo Plan' : 'Pase Temporal'}
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-blue-400 dark:text-blue-400/60 text-xs">Plan</span><p className="font-semibold text-slate-800 dark:text-slate-100">{resumenOperacion.plan}</p></div>
                    {resumenOperacion.duracion && <div><span className="text-blue-400 dark:text-blue-400/60 text-xs">Duración</span><p className="font-semibold text-slate-800 dark:text-slate-100">{resumenOperacion.duracion}</p></div>}
                    <div><span className="text-blue-400 dark:text-blue-400/60 text-xs">Inicio</span><p className="font-semibold text-slate-800 dark:text-slate-100">{resumenOperacion.inicio}</p></div>
                    <div><span className="text-blue-400 dark:text-blue-400/60 text-xs">Vencimiento</span><p className="font-semibold text-slate-800 dark:text-slate-100">{resumenOperacion.fin}</p></div>
                    {resumenOperacion.diasRestantes && <div className="col-span-2"><span className="text-blue-400 dark:text-blue-400/60 text-xs">Días de pase</span><p className="font-semibold text-slate-800 dark:text-slate-100">{resumenOperacion.diasRestantes}</p></div>}
                  </div>
                </div>

                {/* Monto */}
                {resumenOperacion.monto && (
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-500/20 text-center">
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Monto Pagado</span>
                    <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300 mt-1">S/ {resumenOperacion.monto}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shrink-0">
                <button
                  onClick={() => setMostrarModalQR(true)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm text-base flex items-center justify-center gap-2 cursor-pointer"
                >
                  <QrCode size={20} />
                  Confirmar y Ver Pase de Ingreso
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  // ── Vista Maestro (Directorio) ──
  return (
    <div className="p-8 space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Directorio de Miembros</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {miembros.length} miembros registrados
          </p>
        </div>
        <button
          onClick={() => setVistaActiva('Nueva Inscripcion')}
          className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-colors shadow-sm self-start sm:self-auto"
        >
          <UserPlus size={18} />
          Nuevo Miembro
        </button>
      </div>

      {/* Contadores rápidos */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totalActivos}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Activos</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalPases}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pases Activos</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{totalVencidos}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Vencidos</p>
        </div>
      </div>

      {/* Barra de herramientas */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o DNI..."
            className="w-full py-3 pl-11 pr-4 text-sm bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-100 dark:focus:ring-red-500/20 focus:border-red-400 dark:focus:border-red-500/50 transition-all"
          />
        </div>
        <select
          value={ordenarPor}
          onChange={(e) => setOrdenarPor(e.target.value)}
          className="py-3 px-4 text-sm bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-100 dark:focus:ring-red-500/20 focus:border-red-400 cursor-pointer"
        >
          <option value="alfabetico">A - Z</option>
          <option value="fecha_reciente">Mas recientes</option>
          <option value="fecha_antigua">Mas antiguos</option>
        </select>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="py-3 px-4 text-sm bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-100 dark:focus:ring-red-500/20 focus:border-red-400 cursor-pointer"
        >
          <option value="todos">Todos</option>
          <option value="activo">Activos</option>
          <option value="pase_activo">Pase Activo</option>
          <option value="vencido">Vencidos</option>
          <option value="inactivo">Inactivos</option>
          <option value="congelado">Congelados</option>
        </select>
      </div>

      {/* Tabla de miembros */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Header de tabla */}
        <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <span className="col-span-3">Miembro</span>
          <span className="col-span-2">DNI</span>
          <span className="col-span-2">Plan</span>
          <span className="col-span-2">Inicio</span>
          <span className="col-span-2">Vencimiento</span>
          <span className="col-span-1 text-center">Estado</span>
        </div>

        {/* Filas */}
        {miembrosFiltrados.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
            <p className="text-sm">No se encontraron miembros con ese criterio.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {miembrosFiltrados.map(m => (
              <div
                key={m.id}
                onClick={() => setMiembroViendo(m)}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-6 py-4 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
              >
                {/* Nombre */}
                <div className="sm:col-span-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-500 dark:text-slate-400 shrink-0">
                    {m.nombre.charAt(0)}
                  </div>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{m.nombre}</span>
                </div>

                {/* DNI */}
                <div className="sm:col-span-2">
                  <span className="text-sm text-slate-600 dark:text-slate-300 font-mono">{m.dni}</span>
                </div>

                {/* Plan */}
                <div className="sm:col-span-2">
                  <span className="text-sm text-slate-600 dark:text-slate-300">{m.plan}</span>
                </div>

                {/* Inicio */}
                <div className="sm:col-span-2">
                  <span className="text-sm text-slate-500 dark:text-slate-400">{m.inicio || '14/02/2026'}</span>
                </div>

                {/* Vencimiento */}
                <div className="sm:col-span-2">
                  <span className="text-sm text-slate-500 dark:text-slate-400">{m.fin || '—'}</span>
                </div>

                {/* Estado */}
                <div className="sm:col-span-1 flex items-center justify-end gap-3">
                  <span className={`inline-flex items-center justify-center px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap shadow-sm ${estadoBadge[m.estado] || estadoBadge.inactivo}`}>
                    {estadoTexto[m.estado] || m.estado}
                  </span>
                  <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-red-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer info */}
      <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
        Mostrando {miembrosFiltrados.length} de {miembros.length} miembros
      </p>
    </div>
  )
}
