import { createContext, useContext, useState, useEffect } from 'react'
import { apiFetch, getToken } from '../utils/api'

const GymContext = createContext()

export function GymProvider({ children }) {
  const [miembros, setMiembros] = useState([])
  const [historial, setHistorial] = useState([])
  const [planes, setPlanes] = useState([])
  const [configuracion, setConfiguracion] = useState({
    nombre_gimnasio: 'TRAMUSA S.A.',
    moneda: 'S/',
    telefono: '',
    direccion: '',
    mensaje_ticket: '',
    logo_base64: null,
    plantilla_whatsapp: '',
  })
  const [resumen, setResumen] = useState({
    ingresos_hoy: 0,
    miembros_activos: 0,
    asistencias_hoy: 0,
  })
  const [actividadReciente, setActividadReciente] = useState([])
  const [reporteFinanzas, setReporteFinanzas] = useState({ transacciones: [], asistencias_grafico: [], granularidad: 'dia' })

  async function fetchReporteFinanzas(dias = 7) {
    const data = await apiFetch(`obtener_transacciones.php?dias=${dias}`)
    if (data.success) {
      setReporteFinanzas({
        transacciones: data.transacciones || [],
        asistencias_grafico: data.asistencias_grafico || [],
        granularidad: data.granularidad || 'dia',
      })
    }
  }

  const fetchConfiguracion = async () => {
    const data = await apiFetch('obtener_configuracion.php')
    if (data.success && data.configuracion) {
      const c = data.configuracion
      setConfiguracion(prev => ({
        ...prev,
        nombre_gimnasio: c.nombre_gimnasio || prev.nombre_gimnasio,
        moneda: c.moneda || prev.moneda,
        telefono: c.telefono || '',
        direccion: c.direccion || '',
        mensaje_ticket: c.mensaje_ticket || '',
        logo_base64: c.logo_base64 || null,
        plantilla_whatsapp: c.plantilla_whatsapp || '',
      }))
    }
  }

  async function fetchActividadReciente() {
    const data = await apiFetch('obtener_actividad_reciente.php')
    if (data.actividad_reciente) {
      setActividadReciente(data.actividad_reciente)
    }
  }

  async function fetchResumen() {
    const data = await apiFetch('obtener_resumen_dashboard.php')
    if (data.success) {
      setResumen({
        ingresos_hoy: Number(data.ingresos_hoy) || 0,
        miembros_activos: Number(data.miembros_activos) || 0,
        asistencias_hoy: Number(data.asistencias_hoy) || 0,
      })
    }
    await fetchActividadReciente()
  }

  const fetchPlanes = async () => {
    const data = await apiFetch('obtener_planes.php')
    if (!data.success) return

    const planesAdaptados = data.planes.map(plan => {
      const dias = Number(plan.duracion_dias)
      let duracion = plan.duracion
      if (!duracion) {
        if (dias >= 365 && dias % 365 === 0) {
          const a = dias / 365
          duracion = `${a} ${a === 1 ? 'año' : 'años'}`
        } else if (dias >= 30 && dias % 30 === 0) {
          const m = dias / 30
          duracion = `${m} ${m === 1 ? 'mes' : 'meses'}`
        } else {
          duracion = `${dias} ${dias === 1 ? 'día' : 'días'}`
        }
      }
      return {
        ...plan,
        precio: Number(plan.precio),
        activo: Boolean(Number(plan.activo)),
        duracion,
        duracionDias: dias,
        esPromocion: Boolean(Number(plan.es_promocion)),
        fechaInicioVenta: plan.fecha_inicio_venta,
        fechaFinVenta: plan.fecha_fin_venta,
      }
    })
    setPlanes(planesAdaptados)
  }

  const fetchMiembros = async () => {
    const data = await apiFetch('obtener_miembros.php')
    if (!data.success) return

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const miembrosAdaptados = data.miembros.map(m => {
      // Normalizar el estado de la BD a minúsculas para el frontend
      const estadoBD = (m.estado || 'activo').toLowerCase()

      // Cálculo dinámico: si no está manualmente inactivo/congelado, verificar fecha_fin
      let estadoCalculado = estadoBD
      if (estadoBD !== 'inactivo' && estadoBD !== 'congelado') {
        if (m.fecha_fin) {
          const fechaFinAux = m.fecha_fin.split(' ')[0]
          const [year, month, day] = fechaFinAux.split('-')
          const fechaFin = new Date(year, month - 1, day)
          if (fechaFin < hoy) {
            estadoCalculado = 'vencido'
          }
        }
      }

      return {
        ...m,
        id: Number(m.id),
        nombre: m.nombres || m.nombre || 'Sin nombre',
        dni: m.dni || 'Sin DNI',
        celular: m.telefono || m.celular || '',
        email: m.email || '',
        plan: m.plan_nombre || m.plan || 'Sin Plan',
        planId: Number(m.plan_id) || null,
        inicio: m.fecha_inicio || null,
        fin: m.fecha_fin || null,
        estado: estadoCalculado,
        turno: m.turno || '',
        contactoNombre: m.contacto_emergencia_nombre || '',
        contactoTelefono: m.contacto_emergencia_telefono || '',
        qrToken: m.qr_token || null,
        diasRestantes: Number(m.dias_restantes) || 0,
      }
    })
    setMiembros(miembrosAdaptados)
  }

  const fetchHistorial = async () => {
    const data = await apiFetch('obtener_asistencias.php')
    if (!data.success || !data.asistencias) return

    const historialAdaptado = data.asistencias.map(asis => {
      const fechaHora = new Date(asis.fecha_hora)
      const nombre = asis.nombres && asis.apellidos
        ? `${asis.nombres} ${asis.apellidos}`.trim()
        : asis.nombre_miembro || asis.nombre || asis.nombres || 'Miembro'
      const horaVal = !isNaN(fechaHora.getTime()) ? fechaHora : new Date()

      return {
        id: Number(asis.id),
        tipo: asis.tipo || 'asistencia',
        titulo: nombre,
        detalle: asis.detalle || `DNI: ${asis.dni || 'N/A'}`,
        hora: horaVal,
        turno: asis.turno || (horaVal.getHours() < 14 ? 'Mañana' : 'Tarde'),
      }
    })
    setHistorial(historialAdaptado)
  }

  // Refresca miembros + resumen para recalcular vencimientos con la fecha actual
  async function revisarVencimientos() {
    await Promise.all([fetchMiembros(), fetchResumen()])
  }

  function cargarDatosIniciales() {
    fetchPlanes()
    fetchMiembros()
    fetchHistorial()
    fetchConfiguracion()
    fetchResumen()
  }

  useEffect(() => {
    // Solo cargar datos si hay sesión activa; al iniciar sesión la app
    // dispara 'tramusa:login' y se cargan en ese momento.
    if (getToken()) {
      cargarDatosIniciales()
    }
    window.addEventListener('tramusa:login', cargarDatosIniciales)
    return () => window.removeEventListener('tramusa:login', cargarDatosIniciales)
  }, [])

  const agregarMiembro = async (nuevoMiembro) => {
    // Buscar el plan solo si viene un nombre válido, de lo contrario es null (modo personalizado)
    const planObj = nuevoMiembro.plan ? planes.find(p => p.nombre === nuevoMiembro.plan) : null

    const payload = {
      dni: nuevoMiembro.dni,
      nombre: nuevoMiembro.nombre,
      celular: nuevoMiembro.celular || null,
      email: nuevoMiembro.email || null,
      plan_id: planObj ? planObj.id : null,
      fecha_inicio: nuevoMiembro.fechaInicio || null,
      fecha_fin: nuevoMiembro.fechaFin || null,
      estado: nuevoMiembro.estado || 'activo',
      contacto_emergencia_nombre: nuevoMiembro.contactoNombre || null,
      contacto_emergencia_telefono: nuevoMiembro.contactoTelefono || null,
      turno: nuevoMiembro.turno || null,
    }

    const data = await apiFetch('guardar_miembro.php', { method: 'POST', body: payload })
    if (data.success) {
      // Refrescar la lista en segundo plano: la vista no necesita esperar
      // la descarga completa de miembros para mostrar el resumen.
      fetchMiembros()
      return { success: true, data }
    }
    return { success: false, mensaje: data.mensaje }
  }

  const actualizarMiembro = async (id, cambios) => {
    // Actualización local inmediata para feedback instantáneo
    setMiembros(prev => prev.map(m => m.id === id ? { ...m, ...cambios } : m))

    // Traducir camelCase del frontend → snake_case para PHP
    const payload = { id }
    if (cambios.nombre !== undefined) payload.nombre = cambios.nombre
    if (cambios.dni !== undefined) payload.dni = cambios.dni
    if (cambios.celular !== undefined) payload.celular = cambios.celular
    if (cambios.email !== undefined) payload.email = cambios.email
    if (cambios.estado !== undefined) payload.estado = cambios.estado
    if (cambios.plan !== undefined) payload.plan_nombre = cambios.plan
    if (cambios.inicio !== undefined) payload.fecha_inicio = cambios.inicio
    if (cambios.fin !== undefined) payload.fecha_fin = cambios.fin
    if (cambios.turno !== undefined) payload.turno = cambios.turno
    if (cambios.diasRestantes !== undefined) payload.dias_restantes = cambios.diasRestantes
    if (cambios.contactoNombre !== undefined) payload.contacto_emergencia_nombre = cambios.contactoNombre
    if (cambios.contactoTelefono !== undefined) payload.contacto_emergencia_telefono = cambios.contactoTelefono

    const data = await apiFetch('editar_miembro.php', { method: 'POST', body: payload })
    if (!data.success) {
      // Revertir el estado local con los datos reales de la BD
      await fetchMiembros()
      return { success: false, mensaje: data.mensaje }
    }
    return { success: true }
  }

  async function agregarRegistro(nuevoRegistro) {
    // Insertar localmente de inmediato para feedback instantáneo
    const registro = {
      ...nuevoRegistro,
      id: Date.now(),
      hora: new Date(),
      turno: new Date().getHours() < 14 ? 'Mañana' : 'Tarde',
    }
    setHistorial(prev => [registro, ...prev])

    // Visitas libres y cobros ya se persisten por sus propios endpoints
    // (registrarVisitaLibre + registrarTransaccion), no necesitan fetch adicional
    const esSoloLocal = nuevoRegistro.visitaLibre
      || nuevoRegistro.tipo === 'cobro'
      || nuevoRegistro.tipo === 'cobro_asistencia'

    if (esSoloLocal) return registro

    // Asistencias normales de miembros → persistir en la BD
    const data = await apiFetch('registrar_asistencia.php', {
      method: 'POST',
      body: { miembro_id: nuevoRegistro.miembroId || null },
    })

    if (data.success) {
      await fetchResumen()
    } else {
      // No se pudo persistir (ej. asistencia duplicada): quitar el registro local
      setHistorial(prev => prev.filter(h => h.id !== registro.id))
      return { ...registro, error: data.mensaje }
    }

    return registro
  }

  function actualizarRegistro(id, cambios) {
    setHistorial(prev => prev.map(h => h.id === id ? { ...h, ...cambios } : h))
  }

  function eliminarRegistro(id) {
    setHistorial(prev => prev.filter(h => h.id !== id))
  }

  const agregarPlan = async (nuevoPlan) => {
    const payload = {
      nombre: nuevoPlan.nombre,
      precio: Number(nuevoPlan.precio),
      duracion_dias: Number(nuevoPlan.duracionDias || nuevoPlan.duracion || 0),
      es_promocion: Boolean(nuevoPlan.esPromocion || nuevoPlan.es_promocion),
      fecha_inicio_venta: nuevoPlan.fechaInicioVenta || nuevoPlan.fecha_inicio_venta || null,
      fecha_fin_venta: nuevoPlan.fechaFinVenta || nuevoPlan.fecha_fin_venta || null,
      nota: nuevoPlan.nota || null,
    }

    const data = await apiFetch('guardar_plan.php', { method: 'POST', body: payload })
    if (data.success) {
      await fetchPlanes()
    } else {
      alert('Hubo un error al guardar el plan: ' + data.mensaje)
    }
  }

  const actualizarPlan = async (id, planActualizado) => {
    const payload = {
      id: id,
      nombre: planActualizado.nombre,
      precio: Number(planActualizado.precio),
      duracion_dias: Number(planActualizado.duracionDias || planActualizado.duracion || 0),
      es_promocion: Boolean(planActualizado.esPromocion || planActualizado.es_promocion),
      fecha_inicio_venta: planActualizado.fechaInicioVenta || planActualizado.fecha_inicio_venta || null,
      fecha_fin_venta: planActualizado.fechaFinVenta || planActualizado.fecha_fin_venta || null,
      nota: planActualizado.nota || null,
    }

    const data = await apiFetch('editar_plan.php', { method: 'POST', body: payload })
    if (data.success) {
      await fetchPlanes()
    } else {
      alert('Error al actualizar: ' + data.mensaje)
    }
  }

  const eliminarPlan = async (id) => {
    const data = await apiFetch('eliminar_plan.php', { method: 'POST', body: { id } })
    if (data.success) {
      await fetchPlanes()
    } else {
      alert('Error al eliminar: ' + data.mensaje)
    }
  }

  const toggleActivoPlan = async (id) => {
    const planActual = planes.find(p => p.id === id)
    if (!planActual) return

    const data = await apiFetch('toggle_estado_plan.php', {
      method: 'POST',
      body: { id: id, activo: !planActual.activo },
    })
    if (data.success) {
      await fetchPlanes()
    } else {
      alert('Error al cambiar estado: ' + data.mensaje)
    }
  }

  const registrarTransaccion = async (datosTransaccion) => {
    const data = await apiFetch('guardar_transaccion.php', { method: 'POST', body: datosTransaccion })
    if (data.success) {
      await fetchResumen()
    }
    return data
  }

  const registrarVisitaLibre = async (datosVisita) => {
    const data = await apiFetch('registrar_visita_libre.php', { method: 'POST', body: datosVisita })
    if (data.success) {
      await fetchResumen()
    }
    return data
  }

  // Renovación atómica: el backend actualiza al miembro y registra el cobro
  // en una sola transacción SQL (o se guardan ambos, o ninguno).
  async function renovarMiembro(id, datosRenovacion) {
    const { plan, planLabel, fechaInicio, fechaFin, monto, turno, recibo, nombreMiembro } = datosRenovacion

    const data = await apiFetch('renovar_miembro.php', {
      method: 'POST',
      body: {
        miembro_id: id,
        plan_nombre: plan || null,
        fecha_inicio: fechaInicio || null,
        fecha_fin: fechaFin,
        turno: turno || null,
        monto: Number(monto) || 0,
        metodo_pago: 'Efectivo',
        concepto: `Renovación de Plan - ${planLabel || plan}`,
      },
    })

    if (!data.success) {
      return { success: false, mensaje: data.mensaje }
    }

    // Registrar en el historial local de actividad
    agregarRegistro({
      tipo: 'cobro',
      titulo: `Renovación: ${nombreMiembro}`,
      detalle: `Plan: ${planLabel || plan} - Pago: S/ ${Number(monto).toFixed(2)}`,
      recibo: recibo || undefined,
      miembroId: id,
    })

    await Promise.all([fetchMiembros(), fetchResumen()])
    return { success: true }
  }

  async function eliminarMiembro(id) {
    const data = await apiFetch('eliminar_miembro.php', { method: 'POST', body: { id } })
    if (data.success) {
      setMiembros(prev => prev.filter(m => m.id !== id))
      return { success: true }
    }
    return { success: false, mensaje: data.mensaje }
  }

  const guardarConfiguracion = async (nuevosDatos) => {
    const payload = {
      nombre_gimnasio: nuevosDatos.nombre_gimnasio,
      moneda: nuevosDatos.moneda,
      telefono: nuevosDatos.telefono,
      direccion: nuevosDatos.direccion,
      mensaje_ticket: nuevosDatos.mensaje_ticket,
      logo_base64: nuevosDatos.logo_base64 || null,
      plantilla_whatsapp: nuevosDatos.plantilla_whatsapp || null,
    }
    const data = await apiFetch('guardar_configuracion.php', { method: 'POST', body: payload })
    if (data.success) {
      setConfiguracion(prev => ({ ...prev, ...nuevosDatos }))
      return { success: true }
    }
    return { success: false, mensaje: data.mensaje }
  }

  return (
    <GymContext.Provider value={{
      miembros,
      historial,
      planes,
      configuracion,
      resumen,
      actividadReciente,
      fetchResumen,
      agregarMiembro,
      actualizarMiembro,
      agregarRegistro,
      actualizarRegistro,
      eliminarRegistro,
      fetchMiembros,
      fetchHistorial,
      agregarPlan,
      actualizarPlan,
      eliminarPlan,
      toggleActivoPlan,
      registrarTransaccion,
      registrarVisitaLibre,
      renovarMiembro,
      eliminarMiembro,
      revisarVencimientos,
      reporteFinanzas,
      fetchReporteFinanzas,
      guardarConfiguracion,
    }}>
      {children}
    </GymContext.Provider>
  )
}

export function useGym() {
  return useContext(GymContext)
}
