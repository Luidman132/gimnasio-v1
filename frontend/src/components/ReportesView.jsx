import { useState, useEffect } from 'react'
import { DollarSign, Users, CalendarCheck, Download, TrendingUp } from 'lucide-react'
import { useGym } from '../context/GymContext'

function formatEtiqueta(fechaStr, granularidad) {
  if (granularidad === 'mes') {
    // fechaStr viene como "2026-03" desde el backend
    const [year, month] = fechaStr.split('-')
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    return `${meses[parseInt(month) - 1]} ${year.slice(2)}`
  }
  // granularidad === 'dia': fechaStr viene como "2026-03-26"
  const [, month, day] = fechaStr.split('-')
  return `${parseInt(day)}/${parseInt(month)}`
}

function formatTooltip(fechaStr, granularidad) {
  if (granularidad === 'mes') {
    const [year, month] = fechaStr.split('-')
    const date = new Date(year, month - 1, 1)
    return date.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })
  }
  const [year, month, day] = fechaStr.split('-')
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
}

const PERIODOS = [
  { id: '7dias', label: 'Ultimos 7 dias', dias: 7 },
  { id: '14dias', label: 'Ultimos 14 dias', dias: 14 },
  { id: '30dias', label: 'Ultimos 30 dias', dias: 30 },
  { id: 'general', label: 'General', dias: 0 },
]

export default function ReportesView() {
  const { miembros, reporteFinanzas, fetchReporteFinanzas, configuracion } = useGym()
  const [periodo, setPeriodo] = useState('7dias')

  const diasPeriodo = PERIODOS.find(p => p.id === periodo).dias
  const esGeneral = diasPeriodo === 0

  // Fetch al montar y cada vez que cambia el periodo
  useEffect(() => {
    fetchReporteFinanzas(diasPeriodo)
  }, [diasPeriodo])

  const { transacciones, asistencias_grafico, granularidad } = reporteFinanzas
  const moneda = configuracion?.moneda || 'S/'

  // --- KPIs desde datos reales de la BD ---
  const totalIngresos = transacciones.reduce((sum, t) => sum + (parseFloat(t.monto) || 0), 0)
  const totalCobros = transacciones.length
  const totalAsistencias = asistencias_grafico.reduce((sum, dia) => sum + (parseInt(dia.total) || 0), 0)

  // Construir mapa de ingresos por fecha/mes desde transacciones
  const ingresosPorFecha = {}
  transacciones.forEach(t => {
    const fechaRaw = t.fecha?.split(' ')[0] // "2026-03-26 14:00:00" → "2026-03-26"
    if (!fechaRaw) return
    // Para granularidad 'mes', agrupar por YYYY-MM
    const key = granularidad === 'mes' ? fechaRaw.slice(0, 7) : fechaRaw
    ingresosPorFecha[key] = (ingresosPorFecha[key] || 0) + (parseFloat(t.monto) || 0)
  })

  // Construir mapa de asistencias por fecha/mes
  const asistenciasPorFecha = {}
  asistencias_grafico.forEach(dia => {
    asistenciasPorFecha[dia.fecha] = parseInt(dia.total) || 0
  })

  // Generar array de claves para el eje X de los graficos
  let ejeX = []
  if (esGeneral) {
    // Modo General: usar las fechas que devuelve el backend (ya agrupadas por mes)
    const fechasAsistencias = asistencias_grafico.map(d => d.fecha)
    const fechasIngresos = Object.keys(ingresosPorFecha)
    const todasLasFechas = [...new Set([...fechasAsistencias, ...fechasIngresos])].sort()
    ejeX = todasLasFechas
  } else {
    // Modo normal (7/14/30 dias): generar dias consecutivos
    for (let i = diasPeriodo - 1; i >= 0; i--) {
      const fecha = new Date()
      fecha.setDate(fecha.getDate() - i)
      const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
      ejeX.push(key)
    }
  }

  // Detectar "hoy" o "mes actual" para resaltar la barra
  const ahora = new Date()
  const hoyKey = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`
  const mesActualKey = hoyKey.slice(0, 7)

  const datosPorDia = ejeX.map(fecha => ({
    fecha,
    asistencias: asistenciasPorFecha[fecha] || 0,
    ingresos: ingresosPorFecha[fecha] || 0,
  }))

  // Ocupacion
  const miembrosActivos = miembros.filter(m => m.estado === 'activo' || m.estado === 'pase_activo').length
  const miembrosQueAsistieron = new Set(
    transacciones
      .filter(t => t.miembro_id)
      .map(t => t.miembro_id)
  ).size
  const porcentajeOcupacion = miembrosActivos > 0 ? Math.round((miembrosQueAsistieron / miembrosActivos) * 100) : 0

  // Maximos para escala de graficos
  const maxAsistencias = Math.max(...datosPorDia.map(d => d.asistencias), 1)
  const maxIngresos = Math.max(...datosPorDia.map(d => d.ingresos), 1)

  // Miembros por estado (dona)
  const activos = miembros.filter(m => m.estado === 'activo').length
  const pases = miembros.filter(m => m.estado === 'pase_activo').length
  const vencidos = miembros.filter(m => m.estado === 'vencido').length
  const totalMiembros = miembros.length

  const porcentajeActivos = totalMiembros > 0 ? (activos / totalMiembros) * 100 : 0
  const porcentajePases = totalMiembros > 0 ? (pases / totalMiembros) * 100 : 0
  const porcentajeVencidos = totalMiembros > 0 ? (vencidos / totalMiembros) * 100 : 0

  // Miembros por plan
  const porPlan = {}
  miembros.forEach(m => {
    const plan = m.plan || 'Sin plan'
    porPlan[plan] = (porPlan[plan] || 0) + 1
  })

  // Exportar CSV
  function exportarMiembrosCSV() {
    const encabezados = ['Nombre', 'DNI', 'Celular', 'Plan', 'Estado', 'Inicio', 'Fin']
    const filas = miembros.map(m => [
      m.nombre, m.dni, m.celular || '', m.plan, m.estado, m.inicio, m.fin
    ])
    const csv = [encabezados, ...filas].map(f => f.map(c => `"${c}"`).join(',')).join('\n')
    descargarCSV(csv, 'miembros_tramusa.csv')
  }

  function exportarTransaccionesCSV() {
    const encabezados = ['Fecha', 'Concepto', 'Monto', 'Metodo', 'Miembro ID']
    const filas = transacciones.map(t => [
      t.fecha, t.concepto || '', t.monto, t.metodo_pago || '', t.miembro_id || ''
    ])
    const csv = [encabezados, ...filas].map(f => f.map(c => `"${c}"`).join(',')).join('\n')
    descargarCSV(csv, 'transacciones_tramusa.csv')
  }

  function descargarCSV(contenido, nombre) {
    const blob = new Blob(['\uFEFF' + contenido], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = nombre
    link.click()
    URL.revokeObjectURL(url)
  }

  // Decidir cuantas etiquetas mostrar en el eje X
  const totalBarras = datosPorDia.length
  const mostrarCada = totalBarras <= 7 ? 1 : totalBarras <= 14 ? 2 : totalBarras <= 30 ? 4 : Math.ceil(totalBarras / 8)

  // Etiqueta de la tarjeta de ingresos segun periodo
  const etiquetaPeriodo = esGeneral ? 'historico total' : 'en el periodo'

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Reportes</h2>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            {PERIODOS.map(p => (
              <button
                key={p.id}
                onClick={() => setPeriodo(p.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  periodo === p.id ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-violet-50 dark:bg-violet-500/10 rounded-xl"><DollarSign size={20} className="text-violet-600 dark:text-violet-400" /></div>
            <span className="text-sm text-slate-500 dark:text-slate-400">Ingresos</span>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{moneda} {totalIngresos.toFixed(2)}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{totalCobros} cobros {etiquetaPeriodo}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl"><CalendarCheck size={20} className="text-emerald-600 dark:text-emerald-400" /></div>
            <span className="text-sm text-slate-500 dark:text-slate-400">Asistencias</span>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalAsistencias}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">entradas {etiquetaPeriodo}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 rounded-xl"><TrendingUp size={20} className="text-blue-600 dark:text-blue-400" /></div>
            <span className="text-sm text-slate-500 dark:text-slate-400">Ocupacion</span>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{porcentajeOcupacion}%</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{miembrosQueAsistieron} de {miembrosActivos} miembros vinieron</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl"><Users size={20} className="text-amber-600 dark:text-amber-400" /></div>
            <span className="text-sm text-slate-500 dark:text-slate-400">Total Miembros</span>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalMiembros}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{activos} activos, {vencidos} vencidos</p>
        </div>
      </div>

      {/* Graficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grafico de barras - Asistencias */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 p-6">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">
            {granularidad === 'mes' ? 'Asistencias por mes' : 'Asistencias por dia'}
          </h3>
          <div className="flex items-end gap-1 h-40">
            {datosPorDia.map((d, i) => {
              const altura = maxAsistencias > 0 ? (d.asistencias / maxAsistencias) * 100 : 0
              const esActual = granularidad === 'mes' ? d.fecha === mesActualKey : d.fecha === hoyKey
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-800 dark:bg-slate-700 text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap z-10">
                    {formatTooltip(d.fecha, granularidad)}: {d.asistencias} entradas
                  </div>
                  {d.asistencias > 0 && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{d.asistencias}</span>
                  )}
                  <div
                    className={`w-full rounded-t-md transition-all ${esActual ? 'bg-red-500' : 'bg-emerald-400 dark:bg-emerald-500'} group-hover:opacity-80`}
                    style={{ height: `${Math.max(altura, 2)}%`, minHeight: '2px' }}
                  />
                </div>
              )
            })}
          </div>
          {/* Eje X */}
          <div className="flex gap-1 mt-2">
            {datosPorDia.map((d, i) => (
              <div key={i} className="flex-1 text-center">
                {i % mostrarCada === 0 && (
                  <span className="text-[9px] text-slate-400 dark:text-slate-500">
                    {formatEtiqueta(d.fecha, granularidad)}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 dark:bg-emerald-500" />
              <span className="text-[10px] text-slate-400 dark:text-slate-500">{granularidad === 'mes' ? 'Meses anteriores' : 'Dias anteriores'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500" />
              <span className="text-[10px] text-slate-400 dark:text-slate-500">{granularidad === 'mes' ? 'Mes actual' : 'Hoy'}</span>
            </div>
          </div>
        </div>

        {/* Grafico de barras - Ingresos */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 p-6">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">
            {granularidad === 'mes' ? 'Ingresos por mes' : 'Ingresos por dia'}
          </h3>
          <div className="flex items-end gap-1 h-40">
            {datosPorDia.map((d, i) => {
              const altura = maxIngresos > 0 ? (d.ingresos / maxIngresos) * 100 : 0
              const esActual = granularidad === 'mes' ? d.fecha === mesActualKey : d.fecha === hoyKey
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-800 dark:bg-slate-700 text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap z-10">
                    {formatTooltip(d.fecha, granularidad)}: {moneda} {d.ingresos.toFixed(2)}
                  </div>
                  {d.ingresos > 0 && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{moneda}{d.ingresos.toFixed(0)}</span>
                  )}
                  <div
                    className={`w-full rounded-t-md transition-all ${esActual ? 'bg-red-500' : 'bg-violet-400 dark:bg-violet-500'} group-hover:opacity-80`}
                    style={{ height: `${Math.max(altura, 2)}%`, minHeight: '2px' }}
                  />
                </div>
              )
            })}
          </div>
          <div className="flex gap-1 mt-2">
            {datosPorDia.map((d, i) => (
              <div key={i} className="flex-1 text-center">
                {i % mostrarCada === 0 && (
                  <span className="text-[9px] text-slate-400 dark:text-slate-500">
                    {formatEtiqueta(d.fecha, granularidad)}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-violet-400 dark:bg-violet-500" />
              <span className="text-[10px] text-slate-400 dark:text-slate-500">{granularidad === 'mes' ? 'Meses anteriores' : 'Dias anteriores'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500" />
              <span className="text-[10px] text-slate-400 dark:text-slate-500">{granularidad === 'mes' ? 'Mes actual' : 'Hoy'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dona - Miembros por estado */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 p-6 flex flex-col">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-5">Miembros por estado</h3>
          <div className="flex items-center gap-8 flex-1">
            {/* Dona CSS */}
            <div className="relative w-36 h-36 shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="5" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="#10b981" strokeWidth="5"
                  strokeDasharray={`${porcentajeActivos * 0.88} ${88 - porcentajeActivos * 0.88}`}
                  strokeDashoffset="0" strokeLinecap="round" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="#3b82f6" strokeWidth="5"
                  strokeDasharray={`${porcentajePases * 0.88} ${88 - porcentajePases * 0.88}`}
                  strokeDashoffset={`${-porcentajeActivos * 0.88}`} strokeLinecap="round" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="#ef4444" strokeWidth="5"
                  strokeDasharray={`${porcentajeVencidos * 0.88} ${88 - porcentajeVencidos * 0.88}`}
                  strokeDashoffset={`${-(porcentajeActivos + porcentajePases) * 0.88}`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalMiembros}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">total</span>
              </div>
            </div>

            {/* Leyenda */}
            <div className="space-y-3 flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Activos</span>
                </div>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{activos} <span className="text-slate-400 dark:text-slate-500 font-normal">({porcentajeActivos.toFixed(0)}%)</span></span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Pases activos</span>
                </div>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{pases} <span className="text-slate-400 dark:text-slate-500 font-normal">({porcentajePases.toFixed(0)}%)</span></span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Vencidos</span>
                </div>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{vencidos} <span className="text-slate-400 dark:text-slate-500 font-normal">({porcentajeVencidos.toFixed(0)}%)</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Miembros por plan + Exportar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 p-6 flex flex-col">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-5">Miembros por plan</h3>
          <div className="space-y-3 mb-6 flex-1">
            {Object.entries(porPlan).sort((a, b) => b[1] - a[1]).map(([plan, cantidad]) => {
              const pct = totalMiembros > 0 ? (cantidad / totalMiembros) * 100 : 0
              return (
                <div key={plan}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-600 dark:text-slate-400">{plan}</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{cantidad}</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 dark:bg-red-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Exportar */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-5 mt-auto">
            <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-3">Exportar datos</h4>
            <div className="flex gap-3">
              <button
                onClick={exportarMiembrosCSV}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Download size={15} />
                Miembros CSV
              </button>
              <button
                onClick={exportarTransaccionesCSV}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Download size={15} />
                Transacciones CSV
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
