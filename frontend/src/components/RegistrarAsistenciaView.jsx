import { useState, useEffect, useRef } from 'react'
import { Search, UserCircle, UserPlus, ArrowRight, CheckCircle, Pencil, Ticket, QrCode, X, Download } from 'lucide-react'
import QRCode from 'react-qr-code'
import { toPng } from 'html-to-image'
import { formatHora, parseMonto } from '../utils/helpers'
import { apiFetch } from '../utils/api'
import { inputClasses, inputErrorClasses, estilosEstado } from '../utils/constants'
import { useToast } from '../context/ToastContext'
import { useGym } from '../context/GymContext'
import ModalRenovacion from './asistencias/ModalRenovacion'
import ModalPaseTemporal from './asistencias/ModalPaseTemporal'
import ModalEditarCliente from './asistencias/ModalEditarCliente'
import ModalEditarRegistro from './asistencias/ModalEditarRegistro'
import { CurrencyInput } from './CurrencyInput'
import { AsistenciaQRScanner } from './AsistenciaQRScanner'

export default function RegistrarAsistenciaView({ usuario, miembroPreSeleccionado, setMiembroPreSeleccionado }) {
  const { mostrarToast } = useToast()
  const { miembros, historial, actualizarMiembro, agregarRegistro, actualizarRegistro, eliminarRegistro, fetchMiembros, fetchHistorial, registrarTransaccion, registrarVisitaLibre: registrarVisitaLibreBD, renovarMiembro } = useGym()

  const [procesando, setProcesando] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [resultadosBusqueda, setResultadosBusqueda] = useState([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [filtroTiempo, setFiltroTiempo] = useState('todos')

  // Visita libre
  const [mostrandoPaseRapido, setMostrandoPaseRapido] = useState(false)
  const [nombresVisita, setNombresVisita] = useState('')
  const [apellidosVisita, setApellidosVisita] = useState('')
  const [dniVisita, setDniVisita] = useState('')
  const [celularVisita, setCelularVisita] = useState('')
  const [correoVisita, setCorreoVisita] = useState('')
  const [montoVisita, setMontoVisita] = useState('')

  const [erroresVisita, setErroresVisita] = useState({})

  // Modales
  const [mostrarModalRenovacion, setMostrarModalRenovacion] = useState(false)
  const [mostrarModalPase, setMostrarModalPase] = useState(false)
  const [mostrarModalEditarCliente, setMostrarModalEditarCliente] = useState(false)
  const [registroAEditar, setRegistroAEditar] = useState(null)
  const [mostrarScanner, setMostrarScanner] = useState(false)
  const [alertaExito, setAlertaExito] = useState(null)

  // Resumen Visita Libre (nuevo flujo estandarizado)
  const [resumenVisita, setResumenVisita] = useState(null)
  const [mostrarPaseVisita, setMostrarPaseVisita] = useState(false)
  const qrVisitaRef = useRef(null)

  useEffect(() => {
    if (miembroPreSeleccionado) {
      setClienteSeleccionado(miembroPreSeleccionado)
      setBusqueda('')
      setMiembroPreSeleccionado(null)
    }
  }, [miembroPreSeleccionado, setMiembroPreSeleccionado])

  function limpiarBusqueda() {
    setClienteSeleccionado(null)
    setBusqueda('')
    setResultadosBusqueda([])
  }

  function handleSearch(e) {
    const texto = e.target.value
    setBusqueda(texto)
    const normalizarTexto = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    const query = normalizarTexto(texto).trim()
    if (query.length > 2) {
      const terminosBusqueda = query.split(/\s+/)
      setResultadosBusqueda(
        miembros.filter((c) => {
          const nombreNorm = normalizarTexto(c.nombre)
          const dniNorm = c.dni ? normalizarTexto(c.dni) : ''
          return terminosBusqueda.every(termino => nombreNorm.includes(termino) || dniNorm.includes(termino))
        })
      )
    } else {
      setResultadosBusqueda([])
    }
  }

  function seleccionarCliente(cliente) {
    setClienteSeleccionado(cliente)
    setBusqueda('')
    setResultadosBusqueda([])
  }

  async function confirmarAsistencia() {
    if (!clienteSeleccionado) return
    const resultado = await agregarRegistro({
      tipo: 'asistencia',
      titulo: clienteSeleccionado.nombre,
      detalle: `Plan: ${clienteSeleccionado.plan}`,
      miembroId: clienteSeleccionado.id,
    })
    if (resultado?.error) {
      mostrarToast(resultado.error, 'error')
    } else {
      mostrarToast(`Asistencia registrada: ${clienteSeleccionado.nombre}`)
    }
    limpiarBusqueda()
  }

  function registrarAsistenciaPase() {
    if (!clienteSeleccionado) return
    const nuevosDias = clienteSeleccionado.diasRestantes - 1
    agregarRegistro({
      tipo: 'asistencia',
      titulo: clienteSeleccionado.nombre,
      detalle: `Pase: Dias restantes ${nuevosDias}`,
      miembroId: clienteSeleccionado.id,
    })
    if (nuevosDias <= 0) {
      actualizarMiembro(clienteSeleccionado.id, { estado: 'vencido', diasRestantes: 0 })
      mostrarToast(`Pase agotado: ${clienteSeleccionado.nombre}`, 'info')
    } else {
      actualizarMiembro(clienteSeleccionado.id, { diasRestantes: nuevosDias })
      mostrarToast(`Asistencia registrada: ${clienteSeleccionado.nombre} (${nuevosDias} dia${nuevosDias > 1 ? 's' : ''} restante${nuevosDias > 1 ? 's' : ''})`)
    }
    limpiarBusqueda()
  }

  function resetFormularioVisita() {
    setNombresVisita('')
    setApellidosVisita('')
    setDniVisita('')
    setCelularVisita('')
    setCorreoVisita('')
    setMontoVisita('')
    setErroresVisita({})
    setMostrandoPaseRapido(false)
  }

  function limpiarErrorVisita(campo) {
    setErroresVisita((prev) => { const c = { ...prev }; delete c[campo]; return c })
  }

  async function registrarVisitaLibre() {
    if (procesando) return
    const errs = {}
    if (!nombresVisita.trim()) errs.nombres = true
    if (!apellidosVisita.trim()) errs.apellidos = true
    if (!montoVisita || parseFloat(montoVisita) <= 0) errs.monto = true
    setErroresVisita(errs)
    if (Object.keys(errs).length > 0) {
      mostrarToast('Completa nombre, apellido y monto', 'error')
      return
    }
    setProcesando(true)
    const monto = parseFloat(montoVisita)

    // 1. Guardar la visita libre en su tabla propia (MySQL)
    await registrarVisitaLibreBD({
      nombre_completo: `${nombresVisita.trim()} ${apellidosVisita.trim()}`,
      dni: dniVisita.trim() || null,
      telefono: celularVisita.trim() || null,
      correo: correoVisita.trim() || null,
      monto_pagado: monto,
    })

    // 2. Registrar la transacción de dinero (MySQL)
    await registrarTransaccion({
      concepto: 'Pase por Día (Visita Libre)',
      monto,
      metodo_pago: 'Efectivo',
    })

    agregarRegistro({
      tipo: 'cobro_asistencia',
      titulo: `Visita Libre: ${nombresVisita.trim()} ${apellidosVisita.trim()}`,
      detalle: `Pago: S/ ${monto.toFixed(2)}`,
      visitaLibre: true,
      nombres: nombresVisita.trim(),
      apellidos: apellidosVisita.trim(),
      dni: dniVisita,
      celular: celularVisita,
      correo: correoVisita,
    })

    // Abrir Resumen de Visita
    setResumenVisita({
      nombre: `${nombresVisita.trim()} ${apellidosVisita.trim()}`,
      dni: dniVisita || 'No registrado',
      celular: celularVisita || null,
      correo: correoVisita || null,
      monto: monto.toFixed(2),
      fecha: new Date().toLocaleDateString('es-PE'),
    })

    mostrarToast(`Visita libre registrada: ${nombresVisita.trim()} ${apellidosVisita.trim()}`)
    resetFormularioVisita()
    setProcesando(false)
  }

  async function confirmarRenovacion(datos) {
    if (!clienteSeleccionado || procesando) return
    setProcesando(true)
    const monto = parseMonto(datos.monto)
    const nombrePlanCorto = datos.planLabel.split(' ')[0]

    // fechaFin viaja en formato ISO (YYYY-MM-DD), que es lo que MySQL espera
    const resultado = await renovarMiembro(clienteSeleccionado.id, {
      plan: nombrePlanCorto,
      planLabel: datos.planLabel,
      fechaFin: datos.fechaFin,
      monto,
      turno: datos.turno,
      recibo: datos.recibo,
      nombreMiembro: clienteSeleccionado.nombre,
    })

    setProcesando(false)
    if (resultado?.success) {
      mostrarToast(`Suscripcion renovada: ${clienteSeleccionado.nombre} - ${datos.planLabel}`)
    } else {
      mostrarToast(resultado?.mensaje || 'No se pudo registrar la renovación', 'error')
    }
    setMostrarModalRenovacion(false)
    limpiarBusqueda()
  }

  async function procesarVentaPase(diasPase, montoRaw, registrarIngresoAhora) {
    if (!clienteSeleccionado || procesando) return
    setProcesando(true)
    const monto = parseFloat(montoRaw) || 0

    // Registrar transacción en la BD (MySQL)
    if (monto > 0) {
      await registrarTransaccion({
        concepto: `Venta Pase (${diasPase} día${diasPase > 1 ? 's' : ''})`,
        monto,
        metodo_pago: 'Efectivo',
        miembro_id: clienteSeleccionado.id,
      })
    }
    const diasRestantesFinal = registrarIngresoAhora ? diasPase - 1 : diasPase
    const nuevoEstado = (registrarIngresoAhora && diasRestantesFinal <= 0) ? 'vencido' : 'pase_activo'

    actualizarMiembro(clienteSeleccionado.id, { estado: nuevoEstado, diasRestantes: diasRestantesFinal })
    setClienteSeleccionado(prev => ({ ...prev, estado: nuevoEstado, diasRestantes: diasRestantesFinal }))

    const txtDias = `${diasPase} dia${diasPase > 1 ? 's' : ''}`
    if (registrarIngresoAhora) {
      agregarRegistro({
        tipo: 'cobro_asistencia',
        titulo: `Pase (${txtDias}): ${clienteSeleccionado.nombre}`,
        detalle: `Pago: S/ ${monto.toFixed(2)} - Restan: ${diasRestantesFinal}`,
      })
    } else {
      agregarRegistro({
        tipo: 'cobro',
        titulo: `Venta Pase (${txtDias}): ${clienteSeleccionado.nombre}`,
        detalle: `Pago: S/ ${monto.toFixed(2)}`,
      })
    }
    mostrarToast(`Pase vendido: ${clienteSeleccionado.nombre} - ${diasPase} dia${diasPase > 1 ? 's' : ''}`)
    setMostrarModalPase(false)
    limpiarBusqueda()
    setProcesando(false)
  }

  function guardarEdicionCliente(nombre, dni) {
    actualizarMiembro(clienteSeleccionado.id, { nombre, dni })
    setClienteSeleccionado(prev => ({ ...prev, nombre, dni }))
    mostrarToast('Cliente actualizado correctamente')
    setMostrarModalEditarCliente(false)
  }

  function guardarEdicionHistorial(id, cambios) {
    actualizarRegistro(id, cambios)
    mostrarToast('Registro actualizado')
    setRegistroAEditar(null)
  }

  function eliminarRegistroHistorial(id) {
    eliminarRegistro(id)
    mostrarToast('Registro eliminado', 'info')
    setRegistroAEditar(null)
  }

  async function procesarQR(qrToken) {
    if (!qrToken) return

    const data = await apiFetch('registrar_asistencia.php', {
      method: 'POST',
      body: { qr_token: qrToken },
    })

    if (data.success) {
      // Recargar datos para reflejar cambios
      await fetchMiembros()
      await fetchHistorial()

      setAlertaExito({
        nombre: data.nombre || 'Miembro',
        hora: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
      })
      setTimeout(() => setAlertaExito(null), 3500)
      setMostrarScanner(false)
    } else {
      mostrarToast(data.mensaje || 'Error al registrar asistencia', 'error')
      // Si el miembro existe pero tiene plan vencido, seleccionarlo para renovación
      if (data.miembro_id) {
        const miembroEncontrado = miembros.find(m => m.id === Number(data.miembro_id))
        if (miembroEncontrado) {
          seleccionarCliente(miembroEncontrado)
          setMostrarScanner(false)
        }
      }
    }
  }

  const estilo = clienteSeleccionado ? estilosEstado[clienteSeleccionado.estado] : null

  const historialFiltrado = historial.filter(item => {
    const hoy = new Date()
    const fechaItem = new Date(item.hora)
    const fechaHoyLimpiada = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
    const fechaItemLimpiada = new Date(fechaItem.getFullYear(), fechaItem.getMonth(), fechaItem.getDate())
    const diffDias = Math.floor((fechaHoyLimpiada.getTime() - fechaItemLimpiada.getTime()) / (1000 * 60 * 60 * 24))

    if (filtroTiempo === 'hoy') return diffDias === 0
    if (filtroTiempo === 'ayer') return diffDias === 1
    if (filtroTiempo === '1semana') return diffDias >= 2 && diffDias <= 7
    if (filtroTiempo === '2semanas') return diffDias > 7 && diffDias <= 14
    if (filtroTiempo === '1mes') return diffDias > 14 && diffDias <= 30
    return true
  })

  const totalAsistencias = historialFiltrado.filter(h => h.tipo === 'asistencia' || h.tipo === 'cobro_asistencia').length
  const totalCobros = historialFiltrado.filter(h => h.tipo === 'cobro' || h.tipo === 'cobro_asistencia').length

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Registrar Asistencia</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Barra de busqueda */}
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={22} />
            <input
              type="text"
              value={busqueda}
              onChange={handleSearch}
              placeholder="Buscar DNI o Nombres..."
              className="w-full py-4 pl-14 pr-6 text-lg bg-white dark:bg-slate-900 shadow-sm dark:shadow-none rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-100 dark:focus:ring-red-500/20 focus:border-red-400 dark:focus:border-red-500/50 transition-all"
            />
            {busqueda.trim().length > 2 && !clienteSeleccionado && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl dark:shadow-none border border-slate-100 dark:border-slate-800 max-h-64 overflow-y-auto z-50">
                {resultadosBusqueda.length > 0 ? (
                  resultadosBusqueda.map((cliente) => (
                    <div
                      key={cliente.id}
                      onClick={() => seleccionarCliente(cliente)}
                      className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer border-b border-slate-50 dark:border-slate-800/50 last:border-0 flex justify-between items-center transition-colors"
                    >
                      <span className="text-slate-700 dark:text-slate-200 font-medium">{cliente.nombre}</span>
                      <span className="text-sm text-slate-400 dark:text-slate-500">{cliente.dni}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-sm text-slate-400 dark:text-slate-500 text-center">No se encontraron clientes.</div>
                )}
              </div>
            )}
          </div>

          {/* Botón Escanear QR */}
          <button
            type="button"
            onClick={() => setMostrarScanner(true)}
            className="w-full flex items-center justify-center gap-3 p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-semibold text-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <QrCode size={24} />
            Escanear QR de Asistencia
          </button>

          {/* Visita libre */}
          {!mostrandoPaseRapido ? (
            <button
              type="button"
              onClick={() => setMostrandoPaseRapido(true)}
              className="w-full flex items-center justify-between p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-200 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-500/50 hover:shadow-md transition-all group text-left cursor-pointer mt-4"
            >
              <div className="flex items-center gap-5">
                <div className="p-4 bg-red-50 dark:bg-red-500/10 rounded-xl text-red-600 dark:text-red-400 group-hover:bg-red-100 dark:group-hover:bg-red-500/20 group-hover:scale-105 transition-all">
                  <UserPlus size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Registrar Visita Libre</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Ingresa el nombre y el monto para personas no registradas.</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-slate-300 dark:text-slate-600 group-hover:text-red-500 dark:group-hover:text-red-400 group-hover:translate-x-1 transition-all shrink-0" />
            </button>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
              {/* Header */}
              <div className="bg-red-50 dark:bg-red-500/10 px-6 py-4 border-b border-red-100 dark:border-red-500/20 flex items-center gap-3">
                <div className="p-2.5 bg-red-100 dark:bg-red-500/20 rounded-xl">
                  <UserPlus size={20} className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-red-800 dark:text-red-300">Registrar Visita Libre</h4>
                  <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-0.5">Persona no registrada en el sistema</p>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Fila 1: Nombre y Apellido */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nombre(s) <span className="text-red-400">*</span></label>
                    <input type="text" value={nombresVisita} onChange={(e) => { setNombresVisita(e.target.value); limpiarErrorVisita('nombres') }} placeholder="Ej: Juan Carlos" className={erroresVisita.nombres ? inputErrorClasses : inputClasses} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Apellido(s) <span className="text-red-400">*</span></label>
                    <input type="text" value={apellidosVisita} onChange={(e) => { setApellidosVisita(e.target.value); limpiarErrorVisita('apellidos') }} placeholder="Ej: Perez Lopez" className={erroresVisita.apellidos ? inputErrorClasses : inputClasses} />
                  </div>
                </div>

                {/* Fila 2: DNI y Celular */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">DNI</label>
                    <input type="text" value={dniVisita} onChange={(e) => setDniVisita(e.target.value.replace(/\D/g, ''))} maxLength={8} placeholder="12345678" inputMode="numeric" className={inputClasses} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Celular</label>
                    <input type="tel" value={celularVisita} onChange={(e) => setCelularVisita(e.target.value.replace(/\D/g, ''))} maxLength={9} placeholder="987654321" inputMode="numeric" className={inputClasses} />
                  </div>
                </div>

                {/* Fila 3: Correo y Monto */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Correo</label>
                    <input type="email" value={correoVisita} onChange={(e) => setCorreoVisita(e.target.value)} placeholder="correo@ejemplo.com" className={inputClasses} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Monto <span className="text-red-400">*</span></label>
                    <CurrencyInput value={montoVisita} onChange={(v) => { setMontoVisita(v); limpiarErrorVisita('monto') }} />
                  </div>
                </div>

                {/* Botones */}
                <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={resetFormularioVisita} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    Cancelar
                  </button>
                  <button type="button" onClick={registrarVisitaLibre} disabled={procesando} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 px-6 font-semibold text-sm shadow-sm hover:shadow transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                    <CheckCircle size={16} />
                    Registrar Pago y Acceso
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tarjeta del cliente seleccionado */}
          {clienteSeleccionado && estilo && (
            <div className={`p-6 rounded-2xl shadow-sm dark:shadow-none border relative ${estilo.contenedor}`}>
              <button onClick={() => setMostrarModalEditarCliente(true)} className="absolute top-4 right-4 p-2 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"><Pencil size={18} /></button>
              <div className="flex items-start gap-5">
                <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <UserCircle size={40} className="text-slate-400 dark:text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {clienteSeleccionado.estado === 'pase_activo' && <Ticket size={18} className="text-blue-600 dark:text-blue-400" />}
                    <h3 className={`text-lg font-bold ${estilo.texto}`}>{estilo.titulo}</h3>
                  </div>
                  <p className="text-base font-semibold text-slate-800 dark:text-slate-100 mt-1">{clienteSeleccionado.nombre}</p>
                  <div className="mt-3 flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Plan</span>
                      <p className={`font-semibold ${estilo.texto}`}>{clienteSeleccionado.plan}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Vence</span>
                      <p className={`font-semibold ${estilo.texto}`}>{clienteSeleccionado.fin}</p>
                    </div>
                    {clienteSeleccionado.estado === 'pase_activo' && (
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Dias restantes</span>
                        <p className="font-semibold text-blue-900 dark:text-blue-200">{clienteSeleccionado.diasRestantes}</p>
                      </div>
                    )}
                  </div>
                  {clienteSeleccionado.estado === 'pase_activo' && (
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mt-2">Le quedan {clienteSeleccionado.diasRestantes} dia(s) de acceso.</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                {clienteSeleccionado.estado === 'activo' && (
                  <button type="button" onClick={confirmarAsistencia} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 px-6 font-semibold text-center transition-colors flex items-center justify-center gap-2">
                    <CheckCircle size={18} />
                    Confirmar Asistencia
                  </button>
                )}
                {clienteSeleccionado.estado === 'pase_activo' && (
                  <button type="button" onClick={registrarAsistenciaPase} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 px-6 font-semibold text-center transition-colors flex items-center justify-center gap-2">
                    <CheckCircle size={18} />
                    Registrar Asistencia (Descontar 1 dia)
                  </button>
                )}
                {clienteSeleccionado.estado === 'vencido' && (
                  <>
                    <button type="button" onClick={() => setMostrarModalRenovacion(true)} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-3 px-6 font-semibold text-center transition-colors">Renovar Suscripcion</button>
                    <button type="button" onClick={() => setMostrarModalPase(true)} className="flex-1 bg-white hover:bg-red-50 border border-red-300 text-red-600 rounded-xl py-3 px-6 font-semibold text-center transition-colors">Cobrar Pase por Dia</button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Panel de historial */}
        <div className="col-span-1">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 h-150 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Registro de Recepcion</h3>
              <select
                value={filtroTiempo}
                onChange={(e) => setFiltroTiempo(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded-lg focus:ring-red-100 dark:focus:ring-red-500/20 focus:border-red-400 py-1.5 px-3 outline-none cursor-pointer"
              >
                <option value="todos">Todos</option>
                <option value="hoy">Hoy</option>
                <option value="ayer">Ayer</option>
                <option value="1semana">Hace 1 semana</option>
                <option value="2semanas">Hace 2 semanas</option>
                <option value="1mes">Hace 1 mes</option>
              </select>
            </div>
            <div className="flex gap-2 mb-6">
              <span className="bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-md">{totalAsistencias} Entradas</span>
              <span className="bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-bold px-2.5 py-1 rounded-md">{totalCobros} Cobros</span>
            </div>

            {historialFiltrado.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                  <UserCircle size={24} className="text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-sm text-slate-400 dark:text-slate-500">Sin movimientos registrados</p>
              </div>
            ) : (
              <ul className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {historialFiltrado.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <span className="text-sm font-mono font-semibold text-slate-500 dark:text-slate-400 w-14 shrink-0">{formatHora(item.hora)}</span>
                    <div className="flex-1 min-w-0">
                      {item.tipo === 'asistencia' && <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 mb-1">ASISTENCIA</span>}
                      {item.tipo === 'cobro' && <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 mb-1">SOLO COBRO</span>}
                      {item.tipo === 'cobro_asistencia' && <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 mb-1">COBRO + ENTRADA</span>}
                      <p className="text-sm text-slate-700 dark:text-slate-200 font-medium truncate">{item.titulo}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{item.detalle}</p>
                    </div>
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full px-2 py-1 text-xs font-medium shrink-0">{item.turno}</span>
                    <button onClick={() => setRegistroAEditar(item)} className="p-2 text-slate-300 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all ml-2 shrink-0"><Pencil size={16} /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Modales */}
      {mostrarModalRenovacion && clienteSeleccionado && (
        <ModalRenovacion
          cliente={clienteSeleccionado}
          onConfirmar={confirmarRenovacion}
          onCerrar={() => setMostrarModalRenovacion(false)}
        />
      )}

      {mostrarModalPase && clienteSeleccionado && (
        <ModalPaseTemporal
          cliente={clienteSeleccionado}
          onProcesar={procesarVentaPase}
          onCerrar={() => setMostrarModalPase(false)}
        />
      )}

      {mostrarModalEditarCliente && clienteSeleccionado && (
        <ModalEditarCliente
          cliente={clienteSeleccionado}
          onGuardar={guardarEdicionCliente}
          onCerrar={() => setMostrarModalEditarCliente(false)}
        />
      )}

      {registroAEditar && (
        <ModalEditarRegistro
          registro={registroAEditar}
          usuario={usuario}
          onGuardar={guardarEdicionHistorial}
          onEliminar={eliminarRegistroHistorial}
          onCerrar={() => setRegistroAEditar(null)}
        />
      )}

      {mostrarScanner && (
        <AsistenciaQRScanner onClose={() => setMostrarScanner(false)} onScanValid={procesarQR} />
      )}

      {/* MODAL ANIMADO DE ÉXITO DE ASISTENCIA */}
      {alertaExito && (
        <div className="fixed inset-0 z-120 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 transition-all duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden text-center border-4 border-emerald-400">
            <div className="bg-emerald-500 p-8 flex flex-col items-center justify-center animate-pulse">
              <div className="bg-white p-4 rounded-full mb-4 shadow-lg">
                <CheckCircle size={56} className="text-emerald-500" />
              </div>
              <h3 className="text-3xl font-black text-white tracking-tight">¡Adelante!</h3>
            </div>
            <div className="p-8 bg-white">
              <p className="text-emerald-600 font-bold text-sm uppercase tracking-widest mb-2">Asistencia Registrada</p>
              <p className="text-2xl font-bold text-slate-800 tracking-tight mb-2">{alertaExito.nombre}</p>
              <p className="text-slate-500 font-medium">Hora de ingreso: {alertaExito.hora}</p>
            </div>
          </div>
        </div>
      )}
      {/* MODAL RESUMEN DE VISITA LIBRE */}
      {resumenVisita && !mostrarPaseVisita && (
        <div className="fixed inset-0 z-90 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-4xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-transparent dark:border-slate-800 max-h-[90vh]">

            {/* Cabecera */}
            <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 border-b border-slate-100 dark:border-slate-800 text-center relative shrink-0">
              <button
                onClick={() => setResumenVisita(null)}
                className="absolute top-4 right-4 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 bg-white dark:bg-slate-800 rounded-full p-1 shadow-sm cursor-pointer transition-colors"
              >
                <X size={20} />
              </button>
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={36} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">¡Visita Libre Registrada!</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Resumen del acceso temporal</p>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Datos del Visitante */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Datos del Visitante</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-slate-400 dark:text-slate-500 text-xs">Nombre</span><p className="font-semibold text-slate-800 dark:text-slate-100">{resumenVisita.nombre}</p></div>
                  <div><span className="text-slate-400 dark:text-slate-500 text-xs">DNI</span><p className="font-semibold text-slate-800 dark:text-slate-100">{resumenVisita.dni}</p></div>
                  {resumenVisita.celular && <div><span className="text-slate-400 dark:text-slate-500 text-xs">Celular</span><p className="font-semibold text-slate-800 dark:text-slate-100">{resumenVisita.celular}</p></div>}
                  {resumenVisita.correo && <div><span className="text-slate-400 dark:text-slate-500 text-xs">Correo</span><p className="font-semibold text-slate-800 dark:text-slate-100">{resumenVisita.correo}</p></div>}
                </div>
              </div>

              {/* Acceso */}
              <div className="bg-blue-50 dark:bg-blue-500/10 rounded-2xl p-4 border border-blue-100 dark:border-blue-500/20">
                <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">Acceso</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-blue-400 dark:text-blue-400/60 text-xs">Tipo</span><p className="font-semibold text-slate-800 dark:text-slate-100">Visita Libre (1 día)</p></div>
                  <div><span className="text-blue-400 dark:text-blue-400/60 text-xs">Fecha</span><p className="font-semibold text-slate-800 dark:text-slate-100">{resumenVisita.fecha}</p></div>
                </div>
              </div>

              {/* Monto */}
              <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-500/20 text-center">
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Monto Pagado</span>
                <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300 mt-1">S/ {resumenVisita.monto}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shrink-0">
              <button
                onClick={() => setResumenVisita(null)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm text-base cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
