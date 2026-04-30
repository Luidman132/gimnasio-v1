import { useState, useEffect, useRef } from 'react'
import { Users, CalendarCheck, AlertTriangle, CircleDollarSign, UserPlus, ScanLine, Clock, ChevronRight, BookOpen, MessageCircle, User, CheckCircle2, X, FileText } from 'lucide-react'
import { useGym } from '../context/GymContext'
import { formatHora } from '../utils/helpers'

function diasHastaVencimiento(fechaFinStr) {
  if (!fechaFinStr) return -1
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  // Parseo seguro: soporta YYYY-MM-DD y DD/MM/YYYY
  const limpio = fechaFinStr.split(' ')[0]
  let year, month, day
  if (limpio.includes('-')) {
    ;[year, month, day] = limpio.split('-')
  } else if (limpio.includes('/')) {
    ;[day, month, year] = limpio.split('/')
  } else {
    return -1
  }
  const fechaFin = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  return Math.ceil((fechaFin - hoy) / (1000 * 60 * 60 * 24))
}

export default function DashboardInicio({ userName = 'Dina', setVistaActiva, setMiembroPreSeleccionado }) {
  const { miembros, historial, resumen, configuracion, actividadReciente, revisarVencimientos } = useGym()

  // Modal Express
  const [miembroModal, setMiembroModal] = useState(null)
  const [recordatoriosEnviados, setRecordatoriosEnviados] = useState([])

  // Slide-over historial
  const [mostrarHistorialCompleto, setMostrarHistorialCompleto] = useState(false)

  // Detector de cambio de día: si la app queda abierta toda la noche,
  // al cruzar medianoche se recalculan vencimientos automáticamente
  const diaRef = useRef(new Date().getDate())
  useEffect(() => {
    const intervalo = setInterval(() => {
      const diaActual = new Date().getDate()
      if (diaActual !== diaRef.current) {
        diaRef.current = diaActual
        revisarVencimientos()
      }
    }, 60_000) // revisa cada 60 segundos
    return () => clearInterval(intervalo)
  }, [revisarVencimientos])

  // --- Métricas reales desde GymContext ---
  const activos = miembros.filter(m => m.estado === 'activo').length
  const pasesActivos = miembros.filter(m => m.estado === 'pase_activo').length
  const vencidos = miembros.filter(m => m.estado === 'vencido').length

  // Miembros que vencen en los próximos 7 días (solo activos)
  const proximosAVencer = miembros
    .filter(m => m.estado === 'activo' && m.fin)
    .map(m => ({ ...m, diasRestantesVenc: diasHastaVencimiento(m.fin) }))
    .filter(m => m.diasRestantesVenc >= 0 && m.diasRestantesVenc <= 7)
    .sort((a, b) => a.diasRestantesVenc - b.diasRestantesVenc)
    .slice(0, 6)


  // --- Funciones del Modal Express ---
  const handleEnviarRecordatorio = () => {
    if (!miembroModal) return

    if (!recordatoriosEnviados.includes(miembroModal.id)) {
      setRecordatoriosEnviados(prev => [...prev, miembroModal.id])
    }

    const diasTexto = miembroModal.diasRestantesVenc === 0
      ? 'vence hoy'
      : miembroModal.diasRestantesVenc === 1
        ? 'vence mañana'
        : `vence en ${miembroModal.diasRestantesVenc} días`

    const fechaFinFormateada = miembroModal.fin
      ? new Date(miembroModal.fin).toLocaleDateString('es-PE')
      : 'N/A'

    const plantilla = configuracion.plantilla_whatsapp
    const mensaje = plantilla
      ? plantilla
          .replace(/\[NOMBRE\]/g, miembroModal.nombre)
          .replace(/\[PLAN\]/g, miembroModal.plan)
          .replace(/\[DIAS\]/g, diasTexto)
          .replace(/\[FECHA_FIN\]/g, fechaFinFormateada)
          .replace(/\[GIMNASIO\]/g, configuracion.nombre_gimnasio || 'TRAMUSA S.A.')
      : `¡Hola *${miembroModal.nombre}*! 👋\nTe escribimos de *${configuracion.nombre_gimnasio || 'TRAMUSA S.A.'}* para recordarte que tu plan ${miembroModal.plan} ${diasTexto}. ¡Te esperamos para renovar y seguir entrenando! 💪`
    const telefonoLimpio = miembroModal.celular ? miembroModal.celular.replace(/\D/g, '') : ''
    const celular = telefonoLimpio ? (telefonoLimpio.startsWith('51') ? telefonoLimpio : `51${telefonoLimpio}`) : ''
    const url = celular
      ? `https://wa.me/${celular}?text=${encodeURIComponent(mensaje)}`
      : `https://wa.me/?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')

    setMiembroModal(null)
  }

  const handleVerDatosGenerales = () => {
    if (!miembroModal) return
    setMiembroPreSeleccionado(miembroModal)
    setVistaActiva('Miembros')
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* Cabecera */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
          Hola, {userName}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
          Aqui tienes el resumen de hoy
        </p>
      </div>

      {/* Tarjetas de Métricas (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Miembros Activos */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Users size={20} />
            </div>
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Miembros Activos</span>
          </div>
          <div>
            <h3 className="text-4xl font-black text-slate-800 dark:text-slate-100">{resumen.miembros_activos}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">{activos} planes + {pasesActivos} pases</p>
          </div>
        </div>

        {/* Asistencias Hoy */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <CalendarCheck size={20} />
            </div>
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Asistencias Hoy</span>
          </div>
          <div>
            <h3 className="text-4xl font-black text-slate-800 dark:text-slate-100">{resumen?.asistencias_hoy ?? 0}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">entradas registradas</p>
          </div>
        </div>

        {/* Vencidos */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
              <AlertTriangle size={20} />
            </div>
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Vencidos</span>
          </div>
          <div>
            <h3 className="text-4xl font-black text-slate-800 dark:text-slate-100">{vencidos}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">necesitan renovar</p>
          </div>
        </div>

        {/* Ingresos Hoy */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
              <CircleDollarSign size={20} />
            </div>
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Ingresos Hoy</span>
          </div>
          <div>
            <h3 className="text-4xl font-black text-slate-800 dark:text-slate-100">{configuracion?.moneda} {Number(resumen?.ingresos_hoy ?? 0).toFixed(2)}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">cobros del dia</p>
          </div>
        </div>
      </div>

      {/* Botones de Accion Rapida */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setVistaActiva('Nueva Inscripcion')}
          className="bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-200 dark:hover:border-red-500/30 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex items-center justify-center gap-3 transition-all cursor-pointer group"
        >
          <UserPlus className="text-red-500 dark:text-red-400 group-hover:scale-110 transition-transform" size={22} />
          <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">Nueva Inscripcion</span>
        </button>

        <button
          onClick={() => setVistaActiva('Asistencias')}
          className="bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:border-emerald-200 dark:hover:border-emerald-500/30 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex items-center justify-center gap-3 transition-all cursor-pointer group"
        >
          <ScanLine className="text-emerald-500 dark:text-emerald-400 group-hover:scale-110 transition-transform" size={22} />
          <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Escanear Asistencia QR</span>
        </button>

        <button
          onClick={() => setVistaActiva('Miembros')}
          className="bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200 dark:hover:border-blue-500/30 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex items-center justify-center gap-3 transition-all cursor-pointer group"
        >
          <BookOpen className="text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform" size={22} />
          <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Directorio de Miembros</span>
        </button>
      </div>

      {/* Secciones inferiores (Listas) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vencen esta semana */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Vencen esta semana</h3>
            <button
              onClick={() => setVistaActiva('Miembros')}
              className="text-xs font-bold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 flex items-center cursor-pointer"
            >
              Ver todas <ChevronRight size={14} />
            </button>
          </div>

          {proximosAVencer.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-slate-500 flex-1">
              <CalendarCheck size={32} className="mb-2 opacity-50" />
              <p className="text-sm">Ningun miembro vence esta semana</p>
            </div>
          ) : (
            <ul className="space-y-3 flex-1 overflow-y-auto pr-1">
              {proximosAVencer.map(m => (
                <li
                  key={m.id}
                  onClick={() => setMiembroModal(m)}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate flex items-center gap-2">
                      {m.nombre}
                      {recordatoriosEnviados.includes(m.id) && (
                        <CheckCircle2 size={15} className="text-emerald-500 shrink-0" title="Recordatorio enviado" />
                      )}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{m.plan} - Vence: {m.fin}</p>
                  </div>
                  <span className={`shrink-0 ml-3 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                    m.diasRestantesVenc <= 2
                      ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                  }`}>
                    {m.diasRestantesVenc === 0 ? 'Hoy' : m.diasRestantesVenc === 1 ? 'Manana' : `${m.diasRestantesVenc} dias`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Actividad reciente */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Actividad reciente</h3>
            <button
              onClick={() => setMostrarHistorialCompleto(true)}
              className="text-xs font-bold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 flex items-center cursor-pointer"
            >
              Ver historial <ChevronRight size={14} />
            </button>
          </div>

          {(!actividadReciente || actividadReciente.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-slate-500 flex-1">
              <Clock size={32} className="mb-2 opacity-50" />
              <p className="text-sm">Sin actividad registrada hoy</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {actividadReciente.slice(0, 5).map((registro, index) => (
                <li
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-transparent"
                >
                  <span className="text-xs font-mono font-semibold text-slate-400 dark:text-slate-500 w-16 shrink-0 text-center">
                    {formatHora(new Date(registro.fecha))}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 dark:text-slate-200 font-medium truncate">{registro.titulo}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate uppercase font-bold">{registro.detalle}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* CAJÓN DESLIZANTE (SLIDE-OVER) DE HISTORIAL COMPLETO */}
      {mostrarHistorialCompleto && (
        <div
          className="fixed inset-0 z-110 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setMostrarHistorialCompleto(false)}
        />
      )}

      <div className={`
        fixed inset-y-0 right-0 z-120 w-full max-w-105 bg-white dark:bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col
        ${mostrarHistorialCompleto ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Cabecera del Panel */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 dark:bg-emerald-500/10 p-2 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
              <FileText size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg leading-tight tracking-tight">Historial de Actividad</h3>
              <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Bitacora completa del sistema</p>
            </div>
          </div>
          <button
            onClick={() => setMostrarHistorialCompleto(false)}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 bg-white dark:bg-slate-800 rounded-full p-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido Scrolleable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2">
          {historial.length > 0 ? (
            historial.slice(0, 30).map(item => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-transparent"
              >
                <span className="text-xs font-mono font-semibold text-slate-400 dark:text-slate-500 w-12 shrink-0">
                  {formatHora(item.hora)}
                </span>
                <div className="flex-1 min-w-0">
                  {item.tipo === 'asistencia' && <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 mb-0.5">ENTRADA</span>}
                  {item.tipo === 'cobro' && <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 mb-0.5">COBRO</span>}
                  {item.tipo === 'cobro_asistencia' && <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 mb-0.5">COBRO+ENTRADA</span>}
                  <p className="text-sm text-slate-700 dark:text-slate-200 font-medium truncate">{item.titulo}</p>
                </div>
                <span className="bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0">
                  {item.turno}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">
              <FileText size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No hay actividad registrada.</p>
            </div>
          )}
        </div>

        {/* Pie del Panel */}
        <div className="p-4 text-center bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[10px] text-slate-400 dark:text-slate-500">TRAMUSA S.A. - Modulo de Auditoria v1.0 | ES MACHUPICCHU Y SUS COMUNIDADES</p>
        </div>
      </div>

      {/* MODAL EXPRESS DE VENCIMIENTO */}
      {miembroModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-transparent dark:border-slate-800">

            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Accion Rapida</h3>
              <button
                onClick={() => setMiembroModal(null)}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 bg-white dark:bg-slate-800 rounded-full p-1 shadow-sm cursor-pointer transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle size={28} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-tight mb-1">{miembroModal.nombre}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                Plan {miembroModal.plan} - Vence: {miembroModal.fin}
              </p>
              <p className="text-xs font-bold mb-6">
                <span className={`px-2.5 py-1 rounded-lg border ${
                  miembroModal.diasRestantesVenc <= 2
                    ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                }`}>
                  {miembroModal.diasRestantesVenc === 0 ? 'Vence hoy' : miembroModal.diasRestantesVenc === 1 ? 'Vence manana' : `Vence en ${miembroModal.diasRestantesVenc} dias`}
                </span>
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleEnviarRecordatorio}
                  className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                >
                  <MessageCircle size={18} />
                  {recordatoriosEnviados.includes(miembroModal.id) ? 'Reenviar Recordatorio' : 'Enviar WhatsApp'}
                </button>

                <button
                  onClick={handleVerDatosGenerales}
                  className="w-full bg-slate-800 dark:bg-slate-200 hover:bg-slate-700 dark:hover:bg-slate-300 text-white dark:text-slate-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                >
                  <User size={18} /> Ver datos generales
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
