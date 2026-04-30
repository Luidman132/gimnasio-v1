import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, UserPlus, Download, Send, X, AlertTriangle, CheckCircle, User, CalendarDays, ShieldCheck, CreditCard } from 'lucide-react'
import QRCode from 'react-qr-code'
import { toPng } from 'html-to-image'
import { formatDate, addMonths } from '../utils/helpers'
import { inputClasses, inputErrorClasses, inputReadOnly } from '../utils/constants'
import { useToast } from '../context/ToastContext'
import { useGym } from '../context/GymContext'


const PAISES_CODIGOS = [
  { codigo: '+51', pais: 'Peru', flag: '\u{1F1F5}\u{1F1EA}' },
  { codigo: '+1', pais: 'EE.UU. / Canada', flag: '\u{1F1FA}\u{1F1F8}' },
  { codigo: '+57', pais: 'Colombia', flag: '\u{1F1E8}\u{1F1F4}' },
  { codigo: '+56', pais: 'Chile', flag: '\u{1F1E8}\u{1F1F1}' },
  { codigo: '+54', pais: 'Argentina', flag: '\u{1F1E6}\u{1F1F7}' },
  { codigo: '+55', pais: 'Brasil', flag: '\u{1F1E7}\u{1F1F7}' },
  { codigo: '+52', pais: 'Mexico', flag: '\u{1F1F2}\u{1F1FD}' },
  { codigo: '+593', pais: 'Ecuador', flag: '\u{1F1EA}\u{1F1E8}' },
  { codigo: '+591', pais: 'Bolivia', flag: '\u{1F1E7}\u{1F1F4}' },
  { codigo: '+34', pais: 'Espana', flag: '\u{1F1EA}\u{1F1F8}' },
  { codigo: '+44', pais: 'Reino Unido', flag: '\u{1F1EC}\u{1F1E7}' },
  { codigo: '+49', pais: 'Alemania', flag: '\u{1F1E9}\u{1F1EA}' },
  { codigo: '+33', pais: 'Francia', flag: '\u{1F1EB}\u{1F1F7}' },
  { codigo: '+39', pais: 'Italia', flag: '\u{1F1EE}\u{1F1F9}' },
  { codigo: 'otro', pais: 'Otro...', flag: '\u{1F30D}' },
]

// Genera un código tipo: TRAMUSA-ANDR-X7B2
function generarCodigoQRUnico(nombreCompleto) {
  // VALIDACIÓN DE SEGURIDAD: Si no hay nombre, usa 'USER' por defecto
  const nombreSeguro = nombreCompleto ? String(nombreCompleto) : 'USER'

  const nombreLimpio = nombreSeguro.replace(/\s+/g, '')
  const prefijo = nombreLimpio.substring(0, 4).toUpperCase().padEnd(4, 'X')

  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let sufijoAleatorio = ''
  for (let i = 0; i < 4; i++) {
    sufijoAleatorio += caracteres.charAt(Math.floor(Math.random() * caracteres.length))
  }

  return `TRAMUSA-${prefijo}-${sufijoAleatorio}`
}

export default function NuevaInscripcionView({ setVistaActiva }) {
  const { mostrarToast } = useToast()
  const { miembros, planes, agregarMiembro, agregarRegistro, registrarTransaccion } = useGym()
  const hoyIso = new Date().toISOString().split('T')[0]

  const planesActivos = planes.filter(p => {
    if (!p.activo) return false
    if (p.esPromocion && p.fechaInicioVenta && p.fechaFinVenta) {
      return hoyIso >= p.fechaInicioVenta && hoyIso <= p.fechaFinVenta
    }
    return true
  })

  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [tipoDoc, setTipoDoc] = useState('dni')
  const [numDoc, setNumDoc] = useState('')
  const [celular, setCelular] = useState('')
  const [codigoPais, setCodigoPais] = useState('+51')
  const [codigoPersonalizado, setCodigoPersonalizado] = useState('+')
  const [email, setEmail] = useState('')
  const [contactoNombre, setContactoNombre] = useState('')
  const [contactoTelefono, setContactoTelefono] = useState('')
  const [modoFecha, setModoFecha] = useState('automatico')
  const [plan, setPlan] = useState('')
  const [fechaInicio, setFechaInicio] = useState(formatDate(new Date()))
  const [fechaFin, setFechaFin] = useState('')
  const [turno, setTurno] = useState('')
  const [monto, setMonto] = useState('')
  const [montoDisplay, setMontoDisplay] = useState('')

  function handleMontoChange(e) {
    // Solo permite digitos y un punto decimal
    let raw = e.target.value.replace(/[^0-9]/g, '')
    if (!raw) {
      setMonto('')
      setMontoDisplay('')
      limpiarError('monto')
      return
    }
    // Guarda el valor numerico real (en centimos)
    const numero = parseInt(raw, 10)
    // Valor real en soles
    const valorReal = (numero / 100).toFixed(2)
    setMonto(valorReal)
    // Formato display: S/ 2,300.00
    const partes = valorReal.split('.')
    const entero = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    setMontoDisplay(`S/ ${entero}.${partes[1]}`)
    limpiarError('monto')
  }
  function autoFillMonto(precio) {
    const valorReal = precio.toFixed(2)
    setMonto(valorReal)
    const partes = valorReal.split('.')
    const entero = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    setMontoDisplay(`S/ ${entero}.${partes[1]}`)
  }

  function calcularFechaFin(fechaBaseStr, dias) {
    const fecha = new Date(fechaBaseStr + 'T00:00:00')
    fecha.setDate(fecha.getDate() + dias)
    return fecha.toISOString().split('T')[0]
  }

  function handleCambioPlan(e) {
    const nombrePlan = e.target.value
    setPlan(nombrePlan)
    const planEncontrado = planesActivos.find(p => p.nombre === nombrePlan)
    if (planEncontrado) {
      autoFillMonto(planEncontrado.precio)
      if (planEncontrado.duracionDias) {
        const fechaBase = fechaInicio || hoyIso
        setFechaFin(calcularFechaFin(fechaBase, planEncontrado.duracionDias))
      }
    } else {
      setMonto('')
      setMontoDisplay('')
      setFechaFin('')
    }
    limpiarError('monto')
  }

  const esPlanBloqueado = plan !== 'Personalizado' && modoFecha === 'automatico'

  const [otros, setOtros] = useState('')
  const [recibo, setRecibo] = useState('')
  const [boleta, setBoleta] = useState('')
  const [deposito, setDeposito] = useState('')

  const [errores, setErrores] = useState({})
  const [resumenInscripcion, setResumenInscripcion] = useState(null)

  // Flujo de bienvenida QR (Paso 2)
  const [nuevoMiembroQR, setNuevoMiembroQR] = useState(null)
  const [mostrarAlertaWA, setMostrarAlertaWA] = useState(false)
  const qrBienvenidaRef = useRef(null)

  // Seleccionar el primer plan disponible cuando cargan los datos de la BD
  useEffect(() => {
    if (planesActivos.length > 0 && !plan) {
      setPlan(planesActivos[0].nombre)
    }
  }, [planesActivos])

  // Recalcular precio y fechaFin cada vez que cambie plan, fechaInicio o modo
  useEffect(() => {
    if (modoFecha !== 'automatico' || !plan || planesActivos.length === 0) return

    const planObj = planesActivos.find(p => p.nombre === plan)
    if (!planObj) return

    // Auto-completar precio
    autoFillMonto(planObj.precio)

    // Auto-calcular fecha fin
    const base = fechaInicio || formatDate(new Date())
    if (planObj.duracionDias) {
      const fechaObj = new Date(base + 'T00:00:00')
      fechaObj.setDate(fechaObj.getDate() + Number(planObj.duracionDias))
      const yyyy = fechaObj.getFullYear()
      const mm = String(fechaObj.getMonth() + 1).padStart(2, '0')
      const dd = String(fechaObj.getDate()).padStart(2, '0')
      setFechaFin(`${yyyy}-${mm}-${dd}`)
    }
  }, [plan, fechaInicio, modoFecha, planesActivos])

  function limpiarError(campo) {
    setErrores((prev) => {
      const copia = { ...prev }
      delete copia[campo]
      return copia
    })
  }

  function validar() {
    const nuevosErrores = {}

    if (!nombre.trim()) nuevosErrores.nombre = true
    if (!apellido.trim()) nuevosErrores.apellido = true
    if (!numDoc.trim()) nuevosErrores.numDoc = true
    if (!celular.trim()) nuevosErrores.celular = true
    if (!monto.trim()) nuevosErrores.monto = true

    // Validar formato DNI (8 dígitos)
    if (numDoc.trim() && tipoDoc === 'dni' && !/^\d{8}$/.test(numDoc.trim())) {
      nuevosErrores.numDoc = true
    }

    // Validar celular: 9 dígitos para Perú, mínimo 7 para internacionales
    if (celular.trim()) {
      if (codigoPais === '+51' && !/^\d{9}$/.test(celular.trim())) {
        nuevosErrores.celular = true
      } else if (codigoPais !== '+51' && codigoPais !== 'otro' && celular.trim().length < 7) {
        nuevosErrores.celular = true
      } else if (codigoPais === 'otro' && celular.trim().length < 7) {
        nuevosErrores.celular = true
      }
    }

    // Validar fechas en modo personalizado
    if (modoFecha === 'personalizado') {
      if (!fechaInicio) nuevosErrores.fechaInicio = true
      if (!fechaFin) nuevosErrores.fechaFin = true
      if (fechaInicio && fechaFin && fechaFin <= fechaInicio) nuevosErrores.fechaFin = true
    }

    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validar()) {
      mostrarToast('Completa los campos obligatorios correctamente', 'error')
      return
    }

    // Verificar si el documento ya está registrado
    if (numDoc.trim()) {
      const miembroExistente = miembros.find((m) => m.dni === numDoc.trim())
      if (miembroExistente) {
        mostrarToast(`Error: El documento ${numDoc} ya está registrado a nombre de ${miembroExistente.nombre}.`, 'error')
        setErrores((prev) => ({ ...prev, numDoc: true }))
        return
      }
    }

    const esPersonalizado = modoFecha === 'personalizado'
    const nombrePlan = esPersonalizado ? null : plan
    const nombreCompleto = `${nombre.trim()} ${apellido.trim()}`
    const codigoFinal = codigoPais === 'otro' ? codigoPersonalizado : codigoPais
    const telefonoCompleto = celular ? `${codigoFinal} ${celular}`.trim() : ''

    // Enviar fechas directamente en YYYY-MM-DD (formato ISO que ya tienen los inputs)
    const resultado = await agregarMiembro({
      dni: numDoc,
      nombre: nombreCompleto,
      celular: telefonoCompleto,
      email: email.trim() || undefined,
      plan: nombrePlan,
      estado: 'activo',
      fechaInicio,
      fechaFin,
      contactoNombre: contactoNombre || undefined,
      contactoTelefono: contactoTelefono || undefined,
      turno: turno || undefined,
    })

    // SOLO si el backend confirmó éxito
    if (!resultado || !resultado.success) return

    // Usar el qr_token real que generó el backend (PHP uniqid)
    const qrTokenReal = resultado.data.qr_token || generarCodigoQRUnico(nombreCompleto)

    if (monto) {
      // Registrar transacción en la BD (MySQL)
      await registrarTransaccion({
        concepto: `Inscripción - ${nombrePlan || 'Plan Personalizado'}`,
        monto: parseFloat(monto),
        metodo_pago: 'Efectivo',
      })

      agregarRegistro({
        tipo: 'cobro',
        titulo: `Inscripcion: ${nombre.trim()} ${apellido.trim()}`,
        detalle: `Plan: ${nombrePlan || 'Personalizado'} - Pago: S/ ${parseFloat(monto).toFixed(2)}`,
        recibo: recibo || undefined,
        boleta: boleta || undefined,
        deposito: deposito || undefined,
      })
    }

    mostrarToast(`${nombre.trim()} ${apellido.trim()} inscrito correctamente`)

    // Abrir el Resumen de Inscripción con todos los datos guardados
    setResumenInscripcion({
      nombreCompleto,
      dni: numDoc,
      celular: telefonoCompleto,
      email: email.trim() || null,
      contactoNombre: contactoNombre.trim() || null,
      contactoTelefono: contactoTelefono.trim() || null,
      plan: nombrePlan || 'Personalizado',
      fechaInicio,
      fechaFin,
      monto: parseFloat(monto).toFixed(2),
      qrToken: qrTokenReal,
    })
  }

  // --- Funciones del flujo de bienvenida QR ---
  const descargarQRBienvenida = async () => {
    if (!qrBienvenidaRef.current || !nuevoMiembroQR) return
    try {
      const dataUrl = await toPng(qrBienvenidaRef.current, { quality: 1.0, pixelRatio: 3, backgroundColor: '#ffffff' })
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `Pase_QR_${nuevoMiembroQR.nombre.replace(/\s+/g, '_')}.png`
      link.click()
      mostrarToast(`QR de ${nuevoMiembroQR.nombre.split(' ')[0]} descargado`)
    } catch (err) {
      console.error('Error al descargar QR:', err)
      mostrarToast('Error al descargar el QR', 'error')
    }
  }

  const enviarQRWhatsApp = () => {
    setMostrarAlertaWA(true)
  }

  const confirmarEnvioWA = () => {
    if (!nuevoMiembroQR) return

    const mensaje = `¡Hola *${nuevoMiembroQR.nombre}*! 👋\n\n¡Bienvenido a *TRAMUSA S.A.*!\n\nAdjunto a este mensaje te enviamos tu *Pase de Ingreso QR*. Por favor, muéstralo en recepción cada vez que vengas a entrenar.\n\n¡A darle con todo! 💪`
    const numWA = nuevoMiembroQR.celular ? nuevoMiembroQR.celular.replace(/[^0-9]/g, '') : ''
    const url = numWA
      ? `https://wa.me/${numWA}?text=${encodeURIComponent(mensaje)}`
      : `https://wa.me/?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')

    setMostrarAlertaWA(false)
  }

  const confirmarResumenYGenerarPase = () => {
    if (!resumenInscripcion) return
    // Cerrar resumen y abrir el Pase de Ingreso
    const { nombreCompleto, celular: cel, qrToken } = resumenInscripcion
    setResumenInscripcion(null)
    setNuevoMiembroQR({ nombre: nombreCompleto, celular: cel, codigoQR: qrToken })
  }

  const cerrarFlujoBienvenida = () => {
    // 1. Cerrar modales
    setNuevoMiembroQR(null)
    setResumenInscripcion(null)

    // 2. Limpiar formulario completo
    setNombre('')
    setApellido('')
    setTipoDoc('dni')
    setNumDoc('')
    setCelular('')
    setCodigoPais('+51')
    setCodigoPersonalizado('+')
    setEmail('')
    setContactoNombre('')
    setContactoTelefono('')
    setModoFecha('automatico')
    setPlan(planesActivos.length > 0 ? planesActivos[0].nombre : '')
    setFechaInicio(formatDate(new Date()))
    setFechaFin('')
    setTurno('')
    setMonto('')
    setMontoDisplay('')
    setOtros('')
    setRecibo('')
    setBoleta('')
    setDeposito('')
    setErrores({})

    // 3. Redirigir al Inicio
    setVistaActiva('Inicio')
  }

  function getClase(campo) {
    return errores[campo] ? inputErrorClasses : inputClasses
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Nueva Inscripción</h2>
        <button
          onClick={() => setVistaActiva('Inicio')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          Volver
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 p-8 space-y-8">
        <fieldset>
          <legend className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2 w-full">
            1. Información Personal
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nombre(s) <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => { setNombre(e.target.value); limpiarError('nombre') }}
                placeholder="Ej. Carlos"
                className={getClase('nombre')}
              />
              {errores.nombre && <p className="text-xs text-red-500 mt-1">Campo obligatorio</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Apellido(s) <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={apellido}
                onChange={(e) => { setApellido(e.target.value); limpiarError('apellido') }}
                placeholder="Ej. López Mendoza"
                className={getClase('apellido')}
              />
              {errores.apellido && <p className="text-xs text-red-500 mt-1">Campo obligatorio</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Documento de Identidad <span className="text-red-400">*</span></label>
              <div className={`flex rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-red-100 focus-within:border-red-400 ${errores.numDoc ? 'border border-red-300 bg-red-50' : 'border border-slate-200 dark:border-slate-700'}`}>
                <select
                  value={tipoDoc}
                  onChange={(e) => setTipoDoc(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 focus:outline-none"
                >
                  <option value="dni">DNI</option>
                  <option value="extranjeria">C. Extranjería</option>
                  <option value="pasaporte">Pasaporte</option>
                </select>
                <input
                  type="text"
                  value={numDoc}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '')
                    setNumDoc(val)
                    limpiarError('numDoc')
                  }}
                  maxLength={tipoDoc === 'dni' ? 8 : 12}
                  placeholder={tipoDoc === 'dni' ? '8 dígitos' : 'Número de documento'}
                  className={`flex-1 text-sm text-slate-700 dark:text-slate-200 py-2.5 px-4 placeholder:text-slate-400 focus:outline-none ${errores.numDoc ? 'bg-red-50 dark:bg-red-950' : 'bg-slate-50 dark:bg-slate-800'}`}
                />
              </div>
              {errores.numDoc && <p className="text-xs text-red-500 mt-1">{!numDoc.trim() ? 'Campo obligatorio' : miembros.some(m => m.dni === numDoc.trim()) ? 'Este documento ya está registrado' : 'DNI debe tener 8 dígitos'}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Telefono / WhatsApp <span className="text-red-400">*</span></label>
              <div className={`flex rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-red-100 dark:focus-within:ring-red-500/20 focus-within:border-red-400 dark:focus-within:border-red-500 ${errores.celular ? 'border border-red-300 dark:border-red-500/30' : 'border border-slate-200 dark:border-slate-700'}`}>
                <select
                  value={codigoPais}
                  onChange={(e) => setCodigoPais(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 py-2.5 px-2 border-r border-slate-200 dark:border-slate-700 focus:outline-none font-medium"
                >
                  {PAISES_CODIGOS.map((p) => (
                    <option key={p.codigo} value={p.codigo}>
                      {p.flag} {p.codigo !== 'otro' ? p.codigo : ''}
                    </option>
                  ))}
                </select>
                {codigoPais === 'otro' && (
                  <input
                    type="text"
                    value={codigoPersonalizado}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^0-9+]/g, '')
                      if (!val.startsWith('+')) val = '+' + val
                      setCodigoPersonalizado(val)
                    }}
                    maxLength={5}
                    className="w-16 px-2 py-2.5 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 focus:outline-none text-sm text-slate-700 dark:text-slate-200 font-medium text-center"
                    placeholder="+00"
                  />
                )}
                <input
                  type="tel"
                  value={celular}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '')
                    setCelular(val)
                    limpiarError('celular')
                  }}
                  maxLength={codigoPais === '+51' ? 9 : 15}
                  placeholder={codigoPais === '+51' ? '999 888 777' : 'Numero de telefono'}
                  className={`flex-1 text-sm text-slate-700 dark:text-slate-200 py-2.5 px-4 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none ${errores.celular ? 'bg-red-50 dark:bg-red-950' : 'bg-slate-50 dark:bg-slate-800'}`}
                />
              </div>
              {errores.celular && <p className="text-xs text-red-500 mt-1">{celular.trim() ? 'Numero invalido' : 'Campo obligatorio'}</p>}
            </div>

            {/* Correo Electrónico */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Correo Electrónico <span className="text-slate-400 font-normal">(opcional)</span></label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className={inputClasses}
              />
            </div>
          </div>
        </fieldset>

        <div>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mt-8 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Contacto de Emergencia</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nombre del Contacto</label>
              <input
                type="text"
                value={contactoNombre}
                onChange={(e) => setContactoNombre(e.target.value)}
                placeholder="Ej. María López"
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Teléfono de Emergencia</label>
              <input
                type="tel"
                value={contactoTelefono}
                onChange={(e) => setContactoTelefono(e.target.value.replace(/\D/g, ''))}
                maxLength={9}
                placeholder="999 999 999"
                className={inputClasses}
              />
            </div>
          </div>
        </div>

        <fieldset>
          <legend className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2 w-full">
            2. Detalles de Suscripción
          </legend>

          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit mb-6">
            <button
              type="button"
              onClick={() => setModoFecha('automatico')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${modoFecha === 'automatico'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
            >
              Automático (Planes)
            </button>
            <button
              type="button"
              onClick={() => setModoFecha('personalizado')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${modoFecha === 'personalizado'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
            >
              Personalizado (completo)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modoFecha === 'automatico' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Plan</label>
                <select value={plan} onChange={handleCambioPlan} className={inputClasses}>
                  {planesActivos.map(p => (
                    <option key={p.id} value={p.nombre}>
                      {p.nombre} — S/ {p.precio.toFixed(2)}
                    </option>
                  ))}
                  <option value="Personalizado">Plan Personalizado (Manual)</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Fecha de Inicio {modoFecha === 'personalizado' && <span className="text-red-400">*</span>}</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => { setFechaInicio(e.target.value); limpiarError('fechaInicio') }}
                readOnly={modoFecha === 'automatico'}
                className={modoFecha === 'automatico' ? inputReadOnly : getClase('fechaInicio')}
              />
              {errores.fechaInicio && <p className="text-xs text-red-500 mt-1">Fecha requerida</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Fecha de Fin {modoFecha === 'personalizado' && <span className="text-red-400">*</span>}</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => { setFechaFin(e.target.value); limpiarError('fechaFin') }}
                readOnly={modoFecha === 'automatico'}
                className={modoFecha === 'automatico' ? inputReadOnly : getClase('fechaFin')}
              />
              {errores.fechaFin && <p className="text-xs text-red-500 mt-1">{fechaFin ? 'La fecha fin debe ser posterior al inicio' : 'Fecha requerida'}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Turno</label>
              <select value={turno} onChange={(e) => setTurno(e.target.value)} className={inputClasses}>
                <option value="">Seleccionar turno</option>
                <option value="mañana">Mañana</option>
                <option value="tarde">Tarde</option>
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2 w-full">
            3. Datos de Pago
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Monto (S/) <span className="text-red-400">*</span></label>
              <input
                type="text"
                inputMode="numeric"
                value={montoDisplay}
                onChange={handleMontoChange}
                readOnly={esPlanBloqueado}
                placeholder="S/ 0.00"
                className={esPlanBloqueado ? inputReadOnly + ' font-bold text-lg' : getClase('monto')}
              />
              {errores.monto && <p className="text-xs text-red-500 mt-1">Ingresa el monto</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Otros</label>
              <input type="text" value={otros} onChange={(e) => setOtros(e.target.value)} placeholder="Detalle adicional" className={inputClasses} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">N° de Recibo</label>
              <input type="text" value={recibo} onChange={(e) => setRecibo(e.target.value)} placeholder="000-0000" className={inputClasses} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">N° Boleta Electrónica</label>
              <input type="text" value={boleta} onChange={(e) => setBoleta(e.target.value)} placeholder="BE-000000" className={inputClasses} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">N° de Depósito</label>
              <input type="text" value={deposito} onChange={(e) => setDeposito(e.target.value)} placeholder="DEP-000000" className={inputClasses} />
            </div>
          </div>
        </fieldset>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white rounded-xl py-3 px-8 font-semibold transition-colors"
          >
            Registrar Suscripción
          </button>
        </div>
      </form>

      {/* MODAL DE RESUMEN DE INSCRIPCIÓN (Paso 1) */}
      {resumenInscripcion && (
        <div className="fixed inset-0 z-90 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-4xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-transparent dark:border-slate-800 max-h-[90vh]">

            {/* Cabecera */}
            <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 border-b border-slate-100 dark:border-slate-800 text-center relative shrink-0">
              <button
                onClick={() => setResumenInscripcion(null)}
                className="absolute top-4 right-4 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 bg-white dark:bg-slate-800 rounded-full p-1 shadow-sm cursor-pointer transition-colors"
              >
                <X size={20} />
              </button>
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={36} />
              </div>
              <h2 className="font-black text-slate-800 dark:text-slate-100 text-2xl tracking-tight">¡Inscripción Exitosa!</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Verifica los datos antes de generar el pase.</p>
            </div>

            {/* Contenido scrollable */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">

              {/* Información Personal */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200/60 dark:border-slate-700/50">
                  <User size={16} className="text-red-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Información Personal</span>
                </div>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Nombre Completo</span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{resumenInscripcion.nombreCompleto}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400">DNI</span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{resumenInscripcion.dni}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Celular</span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{resumenInscripcion.celular || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Correo Electrónico</span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{resumenInscripcion.email || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Contacto de Emergencia */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200/60 dark:border-slate-700/50">
                  <ShieldCheck size={16} className="text-amber-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Contacto de Emergencia</span>
                </div>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Nombre</span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{resumenInscripcion.contactoNombre || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Teléfono</span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{resumenInscripcion.contactoTelefono || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Plan y Fechas */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200/60 dark:border-slate-700/50">
                  <CalendarDays size={16} className="text-blue-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Información del Plan</span>
                </div>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Plan</span>
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">{resumenInscripcion.plan}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Fecha Inicio</span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{resumenInscripcion.fechaInicio}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Fecha Fin</span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{resumenInscripcion.fechaFin}</span>
                  </div>
                </div>
              </div>

              {/* Monto */}
              <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <CreditCard size={16} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Monto Pagado</span>
                </div>
                <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 tracking-tight">S/ {resumenInscripcion.monto}</span>
              </div>

            </div>

            {/* Botón de acción */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                onClick={confirmarResumenYGenerarPase}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2.5 transition-colors shadow-lg shadow-red-600/20 cursor-pointer text-base"
              >
                <UserPlus size={20} />
                Confirmar y Generar Pase
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL DE PASE DE INGRESO - ENTREGA DE QR (Paso 2) */}
      {nuevoMiembroQR && !resumenInscripcion && (
        <div className="fixed inset-0 z-90 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-4xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-transparent dark:border-slate-800">

            {/* Cabecera */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-center relative">
              <button
                onClick={cerrarFlujoBienvenida}
                className="absolute top-4 right-4 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 bg-white dark:bg-slate-800 rounded-full p-1 shadow-sm cursor-pointer transition-colors"
              >
                <X size={20} />
              </button>
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <UserPlus size={32} />
              </div>
              <h2 className="font-black text-slate-800 dark:text-slate-100 text-2xl tracking-tight">Inscripcion Exitosa!</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Entrega el pase de acceso al nuevo miembro.</p>
            </div>

            {/* Contenedor del QR (se descarga como imagen) */}
            <div className="p-8 flex flex-col items-center justify-center bg-white" ref={qrBienvenidaRef}>
              <h3 className="font-bold text-slate-800 text-xl mb-1">{nuevoMiembroQR.nombre}</h3>
              <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-6">ID: {nuevoMiembroQR.codigoQR}</p>
              <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm inline-block">
                <QRCode value={nuevoMiembroQR.codigoQR || 'ERROR'} size={180} level="H" />
              </div>
              <p className="text-[10px] text-slate-400 mt-4 font-bold tracking-wider">TRAMUSA S.A. - PASE OFICIAL</p>
            </div>

            {/* Botones de accion */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <button
                onClick={descargarQRBienvenida}
                className="w-full bg-slate-800 dark:bg-slate-200 hover:bg-slate-700 dark:hover:bg-slate-300 text-white dark:text-slate-900 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
              >
                <Download size={18} /> Descargar QR de {nuevoMiembroQR.nombre.split(' ')[0]}
              </button>

              <button
                onClick={enviarQRWhatsApp}
                className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
              >
                <Send size={18} /> Enviar por WhatsApp
              </button>

              <button
                onClick={cerrarFlujoBienvenida}
                className="w-full text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium py-2 text-sm transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL MINIMALISTA DE ADVERTENCIA WHATSAPP */}
      {mostrarAlertaWA && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center border border-transparent dark:border-slate-800">

            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Advertencia Importante</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Recuerda adjuntar la imagen del QR que acabas de descargar junto con este mensaje para <span className="font-bold text-slate-700 dark:text-slate-200">{nuevoMiembroQR?.nombre}</span>.
              <br /><br />
              ¿Ya descargaste el QR y deseas continuar a WhatsApp?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setMostrarAlertaWA(false)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEnvioWA}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                Aceptar
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
