import { useState } from 'react'
import { X, Trash2, Save, User, DollarSign, CreditCard, Phone, Mail, IdCard } from 'lucide-react'
import { inputClasses } from '../../utils/constants'
import { CurrencyInput } from '../CurrencyInput'

export default function ModalEditarRegistro({ registro, usuario, onGuardar, onEliminar, onCerrar }) {
  const esVisitaLibre = !!registro.visitaLibre

  // Nombre(s) y Apellido(s)
  const [nombres, setNombres] = useState(() => {
    if (esVisitaLibre) return registro.nombres || ''
    const sep = registro.titulo.indexOf(':')
    const full = sep !== -1 ? registro.titulo.slice(sep + 1).trim() : registro.titulo
    const ult = full.lastIndexOf(' ')
    return ult !== -1 ? full.slice(0, ult) : full
  })
  const [apellidos, setApellidos] = useState(() => {
    if (esVisitaLibre) return registro.apellidos || ''
    const sep = registro.titulo.indexOf(':')
    const full = sep !== -1 ? registro.titulo.slice(sep + 1).trim() : registro.titulo
    const ult = full.lastIndexOf(' ')
    return ult !== -1 ? full.slice(ult + 1) : ''
  })

  // Campos de visita libre
  const [dni, setDni] = useState(registro.dni || '')
  const [celular, setCelular] = useState(registro.celular || '')
  const [correo, setCorreo] = useState(registro.correo || '')

  // Prefijo del titulo
  const separador = registro.titulo.indexOf(':')
  const prefijo = separador !== -1 ? registro.titulo.slice(0, separador + 1) : ''

  // Monto
  const montoMatch = registro.detalle.match(/S\/\s*([0-9.]+)/)
  const montoInicial = montoMatch ? montoMatch[1] : ''
  const [monto, setMonto] = useState(() => {
    if (!montoInicial) return ''
    return parseFloat(montoInicial).toFixed(2)
  })

  // Plan
  const planMatch = registro.detalle.match(/Plan:\s*([A-Za-z0-9 ()áéíóú]+)(?=\s*-|$)/)
  const [plan, setPlan] = useState(planMatch ? planMatch[1].trim() : '')

  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false)

  function handleGuardar() {
    const nombreFull = [nombres.trim(), apellidos.trim()].filter(Boolean).join(' ')
    const nuevoTitulo = prefijo ? `${prefijo} ${nombreFull}` : nombreFull

    // Reconstruir detalle
    const partes = []
    if (plan) partes.push(`Plan: ${plan}`)
    if (monto) partes.push(`Pago: S/ ${(parseFloat(monto) || 0).toFixed(2)}`)
    const restanMatch = registro.detalle.match(/Restan:\s*\d+/)
    if (restanMatch) partes.push(restanMatch[0])
    const nuevoDetalle = partes.length > 0 ? partes.join(' - ') : registro.detalle

    const cambios = { titulo: nuevoTitulo, detalle: nuevoDetalle }
    if (esVisitaLibre) {
      cambios.nombres = nombres.trim()
      cambios.apellidos = apellidos.trim()
      cambios.dni = dni
      cambios.celular = celular
      cambios.correo = correo
    }
    onGuardar(registro.id, cambios)
  }

  function handleEliminar() {
    if (confirmandoEliminar) {
      onEliminar(registro.id)
    } else {
      setConfirmandoEliminar(true)
    }
  }

  const tipoBadge = {
    asistencia: { label: 'Asistencia', bg: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' },
    cobro: { label: 'Cobro', bg: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400' },
    cobro_asistencia: { label: 'Cobro + Entrada', bg: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' },
  }
  const badge = tipoBadge[registro.tipo] || tipoBadge.asistencia

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-transparent dark:border-slate-800">
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-800 px-6 py-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Editar Registro</h3>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${badge.bg}`}>
              {badge.label}
            </span>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Campos */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {prefijo && (
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">Tipo de registro</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{prefijo.replace(':', '')}</p>
            </div>
          )}

          {/* Nombre(s) y Apellido(s) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                <User size={14} className="text-slate-400 dark:text-slate-500" />
                Nombre(s)
              </label>
              <input
                type="text"
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
                placeholder="Ej: Juan Carlos"
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Apellido(s)
              </label>
              <input
                type="text"
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                placeholder="Ej: Lopez Perez"
                className={inputClasses}
              />
            </div>
          </div>

          {/* DNI y Celular - solo visita libre */}
          {esVisitaLibre && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  <IdCard size={14} className="text-slate-400 dark:text-slate-500" />
                  DNI
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={dni}
                  onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                  maxLength={8}
                  placeholder="12345678"
                  className={inputClasses}
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  <Phone size={14} className="text-slate-400 dark:text-slate-500" />
                  Celular
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={celular}
                  onChange={(e) => setCelular(e.target.value.replace(/\D/g, ''))}
                  maxLength={9}
                  placeholder="987654321"
                  className={inputClasses}
                />
              </div>
            </div>
          )}

          {/* Correo - solo visita libre */}
          {esVisitaLibre && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                <Mail size={14} className="text-slate-400 dark:text-slate-500" />
                Correo
              </label>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="correo@ejemplo.com"
                className={inputClasses}
              />
            </div>
          )}

          {/* Plan */}
          {plan !== '' && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                <CreditCard size={14} className="text-slate-400 dark:text-slate-500" />
                Tipo de Plan
              </label>
              <select value={plan} onChange={(e) => setPlan(e.target.value)} className={inputClasses}>
                <option value="Mensual (1 mes)">Mensual (1 mes)</option>
                <option value="Trimestral (3 meses)">Trimestral (3 meses)</option>
                <option value="Semestral (6 meses)">Semestral (6 meses)</option>
                <option value="Mensual">Mensual</option>
                <option value="Trimestral">Trimestral</option>
                <option value="Semestral">Semestral</option>
              </select>
            </div>
          )}

          {/* Monto */}
          {montoInicial !== '' && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                <DollarSign size={14} className="text-slate-400 dark:text-slate-500" />
                Monto Cobrado
              </label>
              <CurrencyInput value={monto} onChange={setMonto} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {usuario?.rol === 'admin' ? (
            <button
              type="button"
              onClick={handleEliminar}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                confirmandoEliminar
                  ? 'bg-red-600 text-white hover:bg-red-700 shadow-sm'
                  : 'text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10'
              }`}
            >
              <Trash2 size={15} />
              {confirmandoEliminar ? 'Confirmar' : 'Eliminar'}
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCerrar}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleGuardar}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 px-6 font-semibold text-sm shadow-sm hover:shadow transition-all"
            >
              <Save size={15} />
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
