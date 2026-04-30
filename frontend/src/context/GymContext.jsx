import { createContext, useContext, useState, useEffect } from 'react'

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
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/obtener_transacciones.php?dias=${dias}&t=${new Date().getTime()}`)
      const data = await response.json()
      if (data.success) {
        setReporteFinanzas({
          transacciones: data.transacciones || [],
          asistencias_grafico: data.asistencias_grafico || [],
          granularidad: data.granularidad || 'dia',
        })
      } else {
        console.warn('[fetchReporteFinanzas] Error del servidor:', data.mensaje)
      }
    } catch (error) {
      console.warn('[fetchReporteFinanzas] Error de conexión:', error)
    }
  }

  const fetchConfiguracion = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/obtener_configuracion.php`)
      const data = await response.json()
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
    } catch (error) {
      console.warn('[fetchConfiguracion] Error de conexión:', error)
    }
  }

  async function fetchActividadReciente() {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/obtener_actividad_reciente.php?t=${new Date().getTime()}`)
      const data = await response.json()
      if (data.actividad_reciente) {
        setActividadReciente(data.actividad_reciente)
      }
    } catch (error) {
      console.warn('[fetchActividadReciente] Error:', error)
    }
  }

  async function fetchResumen() {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/obtener_resumen_dashboard.php?t=` + new Date().getTime())
      const data = await response.json()
      console.log('=> DATO FRESCO DEL DASHBOARD:', data)
      if (data.success) {
        setResumen({
          ingresos_hoy: Number(data.ingresos_hoy) || 0,
          miembros_activos: Number(data.miembros_activos) || 0,
          asistencias_hoy: Number(data.asistencias_hoy) || 0,
        })
      }
      await fetchActividadReciente();
    } catch (error) {
      console.warn('[fetchResumen] Error de conexión:', error)
    }
  }

  const fetchPlanes = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/obtener_planes.php`);
      const data = await response.json();
      if (data.success) {
        const planesAdaptados = data.planes.map(plan => {
          const dias = Number(plan.duracion_dias);
          let duracion = plan.duracion;
          if (!duracion) {
            if (dias >= 365 && dias % 365 === 0) {
              const a = dias / 365;
              duracion = `${a} ${a === 1 ? 'año' : 'años'}`;
            } else if (dias >= 30 && dias % 30 === 0) {
              const m = dias / 30;
              duracion = `${m} ${m === 1 ? 'mes' : 'meses'}`;
            } else {
              duracion = `${dias} ${dias === 1 ? 'día' : 'días'}`;
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
          };
        });
        setPlanes(planesAdaptados);
      } else {
        console.error("Error del servidor:", data.mensaje);
      }
    } catch (error) {
      console.error("Error conectando con la API de planes:", error);
    }
  };

  const fetchMiembros = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/obtener_miembros.php`);
      const data = await response.json();

      if (data.success) {
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
        });
        setMiembros(miembrosAdaptados);
      } else {
        console.error("Error del servidor:", data.mensaje);
      }
    } catch (error) {
      console.error("Error conectando con la API de miembros:", error);
    }
  };

  const fetchHistorial = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/obtener_asistencias.php`);
      const data = await response.json();

      if (data.success && data.asistencias) {
        const historialAdaptado = data.asistencias.map(asis => {
          const fechaHora = new Date(asis.fecha_hora);
          const nombre = asis.nombres && asis.apellidos
            ? `${asis.nombres} ${asis.apellidos}`.trim()
            : asis.nombre_miembro || asis.nombre || asis.nombres || 'Miembro';
          const horaVal = !isNaN(fechaHora.getTime()) ? fechaHora : new Date();

          return {
            id: Number(asis.id),
            tipo: asis.tipo || 'asistencia',
            titulo: nombre,
            detalle: asis.detalle || `DNI: ${asis.dni || 'N/A'}`,
            hora: horaVal,
            turno: asis.turno || (horaVal.getHours() < 14 ? 'Mañana' : 'Tarde'),
          };
        });
        setHistorial(historialAdaptado);
      } else {
        // Backend devolvió error — no silenciar, loguearlo con detalle
        console.warn("[fetchHistorial] Backend respondió sin éxito:", data.mensaje || 'Sin mensaje');
      }
    } catch (error) {
      console.error("[fetchHistorial] Error de conexión:", error);
    }
  };

  // Refresca miembros + resumen para recalcular vencimientos con la fecha actual
  async function revisarVencimientos() {
    await Promise.all([fetchMiembros(), fetchResumen()])
  }

  useEffect(() => {
    fetchPlanes()
    fetchMiembros()
    fetchHistorial()
    fetchConfiguracion()
    fetchResumen()
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

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/guardar_miembro.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (data.success) {
        await fetchMiembros()
        return { success: true, data }
      } else {
        alert("Error al inscribir: " + data.mensaje)
        return { success: false }
      }
    } catch (error) {
      console.error("Error conectando con la API:", error)
      return { success: false }
    }
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

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/editar_miembro.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (data.success) {
        return { success: true }
      } else {
        console.error("Error al actualizar miembro:", data.mensaje)
        return { success: false }
      }
    } catch (error) {
      console.error("Error conectando con la API:", error)
      return { success: false }
    }
  }

  async function agregarRegistro(nuevoRegistro) {
    console.log('3. Entrando a agregarRegistro en Contexto. Datos:', nuevoRegistro)
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
    const payload = {
      miembro_id: nuevoRegistro.miembroId || null,
      tipo: nuevoRegistro.tipo || 'asistencia',
      titulo: nuevoRegistro.titulo || '',
      detalle: nuevoRegistro.detalle || '',
    }
    console.log('[Asistencia Miembro] Enviando:', payload)
    console.log('4. Haciendo fetch a PHP...')

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/registrar_asistencia.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await response.json()
      console.log('[Asistencia Miembro] Respuesta:', data)

      if (data.success) {
        await fetchResumen()
      } else {
        console.error('[Asistencia Miembro] Error del servidor:', data.mensaje)
      }
    } catch (error) {
      console.warn("[agregarRegistro] No se pudo persistir en BD:", error)
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
      nota: nuevoPlan.nota || null
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/guardar_plan.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        await fetchPlanes();
      } else {
        console.error("Error al guardar:", data.mensaje);
        alert("Hubo un error al guardar el plan: " + data.mensaje);
      }
    } catch (error) {
      console.error("Error conectando con la API:", error);
    }
  };

  const actualizarPlan = async (id, planActualizado) => {
    const payload = {
      id: id,
      nombre: planActualizado.nombre,
      precio: Number(planActualizado.precio),
      duracion_dias: Number(planActualizado.duracionDias || planActualizado.duracion || 0),
      es_promocion: Boolean(planActualizado.esPromocion || planActualizado.es_promocion),
      fecha_inicio_venta: planActualizado.fechaInicioVenta || planActualizado.fecha_inicio_venta || null,
      fecha_fin_venta: planActualizado.fechaFinVenta || planActualizado.fecha_fin_venta || null,
      nota: planActualizado.nota || null
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/editar_plan.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        await fetchPlanes();
      } else {
        alert("Error al actualizar: " + data.mensaje);
      }
    } catch (error) {
      console.error("Error conectando con la API:", error);
    }
  };

  const eliminarPlan = async (id) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/eliminar_plan.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      const data = await response.json();
      if (data.success) {
        await fetchPlanes();
      } else {
        alert("Error al eliminar: " + data.mensaje);
      }
    } catch (error) {
      console.error("Error de conexión:", error);
    }
  };

  const toggleActivoPlan = async (id) => {
    const planActual = planes.find(p => p.id === id);
    if (!planActual) return;

    const nuevoEstado = !planActual.activo;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/toggle_estado_plan.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, activo: nuevoEstado })
      });

      const data = await response.json();
      if (data.success) {
        await fetchPlanes();
      } else {
        alert("Error al cambiar estado: " + data.mensaje);
      }
    } catch (error) {
      console.error("Error conectando con la API:", error);
    }
  };

  const registrarTransaccion = async (datosTransaccion) => {
    try {
      console.log('[registrarTransaccion] Enviando payload:', datosTransaccion)
      const response = await fetch(`${import.meta.env.VITE_API_URL}/guardar_transaccion.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosTransaccion),
      })
      const data = await response.json()
      console.log('[registrarTransaccion] Respuesta del servidor:', data)
      if (data.success) {
        await fetchResumen()
      } else {
        console.error('[registrarTransaccion] Error del servidor:', data.mensaje)
      }
      return data
    } catch (error) {
      console.error('[registrarTransaccion] Error de conexión:', error)
      return { success: false }
    }
  }

  const registrarVisitaLibre = async (datosVisita) => {
    try {
      console.log('[registrarVisitaLibre] Enviando payload:', datosVisita)
      const response = await fetch(`${import.meta.env.VITE_API_URL}/registrar_visita_libre.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosVisita),
      })
      const data = await response.json()
      console.log('[registrarVisitaLibre] Respuesta del servidor:', data)
      if (data.success) {
        await fetchResumen()
      } else {
        console.error('[registrarVisitaLibre] Error del servidor:', data.mensaje)
      }
      return data
    } catch (error) {
      console.error('[registrarVisitaLibre] Error de conexión:', error)
      return { success: false }
    }
  }

  async function renovarMiembro(id, datosRenovacion) {
    const { plan, planLabel, fechaInicio, fechaFin, monto, turno, recibo, nombreMiembro } = datosRenovacion

    try {
      // 1. Actualizar estado del miembro en la BD
      const resActualizar = await actualizarMiembro(id, {
        estado: 'activo',
        plan: plan,
        inicio: fechaInicio || undefined,
        fin: fechaFin,
        turno: turno || undefined,
      })

      // 2. Registrar el cobro como transacción en la BD
      const resTransaccion = await registrarTransaccion({
        concepto: `Renovación de Plan - ${planLabel || plan}`,
        monto: Number(monto) || 0,
        metodo_pago: 'Efectivo',
        miembro_id: id,
      })

      // 3. Registrar en el historial de actividad
      agregarRegistro({
        tipo: 'cobro',
        titulo: `Renovación: ${nombreMiembro}`,
        detalle: `Plan: ${planLabel || plan} - Pago: S/ ${Number(monto).toFixed(2)}`,
        recibo: recibo || undefined,
        miembroId: id,
      })

      return {
        success: resActualizar?.success !== false && resTransaccion?.success !== false,
      }
    } catch (error) {
      console.error('[renovarMiembro] Error:', error)
      return { success: false }
    }
  }

  async function eliminarMiembro(id) {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/eliminar_miembro.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      const data = await response.json()
      if (data.success) {
        setMiembros(prev => prev.filter(m => m.id !== id))
        return { success: true }
      } else {
        console.error('[eliminarMiembro] Error del servidor:', data.mensaje)
        return { success: false, mensaje: data.mensaje }
      }
    } catch (error) {
      console.error('[eliminarMiembro] Error de conexión:', error)
      return { success: false }
    }
  }

  const guardarConfiguracion = async (nuevosDatos) => {
    try {
      const payload = {
        nombre_gimnasio: nuevosDatos.nombre_gimnasio,
        moneda: nuevosDatos.moneda,
        telefono: nuevosDatos.telefono,
        direccion: nuevosDatos.direccion,
        mensaje_ticket: nuevosDatos.mensaje_ticket,
        logo_base64: nuevosDatos.logo_base64 || null,
        plantilla_whatsapp: nuevosDatos.plantilla_whatsapp || null,
      }
      const response = await fetch(`${import.meta.env.VITE_API_URL}/guardar_configuracion.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await response.json()
      if (data.success) {
        setConfiguracion(prev => ({ ...prev, ...nuevosDatos }))
        return { success: true }
      } else {
        console.error('Error al guardar configuración:', data.mensaje)
        return { success: false, mensaje: data.mensaje }
      }
    } catch (error) {
      console.error('Error de conexión:', error)
      return { success: false }
    }
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
