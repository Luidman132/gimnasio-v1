import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { formatDate, addMonths, parseMonto } from '../../utils/helpers'
import { inputClasses, inputReadOnly } from '../../utils/constants'
import { useToast } from '../../context/ToastContext'
import { useGym } from '../../context/GymContext'
import { CurrencyInput } from '../CurrencyInput'

export default function ModalRenovacion({ cliente, onConfirmar, onCerrar }) {
  const { mostrarToast } = useToast()
  const { planes } = useGym()
  const hoyIso = new Date().toISOString().split('T')[0]
  const planesActivos = planes.filter(p => {
    if (!p.activo) return false
    if (p.esPromocion && p.fechaInicioVenta && p.fechaFinVenta) {
      return hoyIso >= p.fechaInicioVenta && hoyIso <= p.fechaFinVenta
    }
    return true
  })

  const [modoFecha, setModoFecha] = useState('automatico')
  const [plan, setPlan] = useState('Mensual')
  const [inicio, setInicio] = useState(formatDate(new Date()))
  const [fin, setFin] = useState('')
  const [monto, setMonto] = useState('')
  const [turno, setTurno] = useState('mañana')
  const [recibo, setRecibo] = useState('')
  const [errores, setErrores] = useState({})

  const planObj = planesActivos.find(p => p.nombre === plan)
  const esPlanBloqueado = plan !== 'Personalizado' && modoFecha === 'automatico'

  const inicioCalculado = modoFecha === 'automatico' ? formatDate(new Date()) : inicio
  const finCalculado = modoFecha === 'automatico'
    ? (planObj
        ? (planObj.meses > 0
            ? formatDate(addMonths(new Date(), planObj.meses))
            : formatDate((() => { const d = new Date(); d.setDate(d.getDate() + 1); return d })()))
        : '')
    : fin

  useEffect(() => {
    if (modoFecha === 'automatico' && planObj) {
      setMonto(planObj.precio.toFixed(2))
    }
  }, [plan, modoFecha])

  function handleCambioPlan(e) {
    const nombre = e.target.value
    setPlan(nombre)
    const encontrado = planesActivos.find(p => p.nombre === nombre)
    if (encontrado) {
      setMonto(encontrado.precio.toFixed(2))
    } else {
      setMonto('')
    }
    setErrores(p => { const c = { ...p }; delete c.monto; return c })
  }

  function handleConfirmar() {
    const errs = {}
    if (!monto || parseMonto(monto) <= 0) errs.monto = true
    if (modoFecha === 'personalizado') {
      if (!inicio) errs.inicio = true
      if (!fin) errs.fin = true
      if (inicio && fin && fin <= inicio) errs.fin = true
    }
    setErrores(errs)
    if (Object.keys(errs).length > 0) {
      mostrarToast('Completa el monto correctamente', 'error')
      return
    }
    onConfirmar({
      plan,
      planLabel: planObj ? `${planObj.nombre} (${planObj.duracion})` : plan,
      fechaFin: finCalculado,
      monto: monto,
      turno,
      recibo,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-transparent dark:border-slate-800">
        <div className="bg-red-50 dark:bg-red-900/20 p-6 flex items-center justify-between border-b border-transparent dark:border-slate-800/50">
          <div>
            <h3 className="text-lg font-bold text-red-800 dark:text-red-300">Renovar Suscripción</h3>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{cliente.nombre}</p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-800/50 text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit">
            <button
              type="button"
              onClick={() => setModoFecha('automatico')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                modoFecha === 'automatico'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Automático (Planes)
            </button>
            <button
              type="button"
              onClick={() => setModoFecha('personalizado')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                modoFecha === 'personalizado'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Personalizado
            </button>
          </div>

          {modoFecha === 'automatico' && (
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Plan</label>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Fecha de Inicio</label>
              <input
                type="date"
                value={inicioCalculado}
                onChange={(e) => setInicio(e.target.value)}
                readOnly={modoFecha === 'automatico'}
                className={modoFecha === 'automatico' ? inputReadOnly : inputClasses}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Fecha de Fin</label>
              <input
                type="date"
                value={finCalculado}
                onChange={(e) => setFin(e.target.value)}
                readOnly={modoFecha === 'automatico'}
                className={modoFecha === 'automatico' ? inputReadOnly : inputClasses}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Monto</label>
              {esPlanBloqueado ? (
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-normal">S/</span>
                  <input
                    type="text"
                    readOnly
                    value={monto ? parseFloat(monto).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
                    className={inputReadOnly + ' pl-10 text-lg font-bold'}
                  />
                </div>
              ) : (
                <CurrencyInput value={monto} onChange={(v) => { setMonto(v); setErrores(p => { const c = {...p}; delete c.monto; return c }) }} />
              )}
              {errores.monto && <p className="text-xs text-red-500 mt-1">Ingresa el monto</p>}
            </div>
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Turno</label>
              <select value={turno} onChange={(e) => setTurno(e.target.value)} className={inputClasses}>
                <option value="mañana">Mañana</option>
                <option value="tarde">Tarde</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">N° de Recibo / Boleta</label>
            <input
              type="text"
              value={recibo}
              onChange={(e) => setRecibo(e.target.value)}
              placeholder="000-0000"
              className={inputClasses}
            />
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCerrar}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            className="bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600 text-white rounded-xl py-2.5 px-6 font-semibold transition-colors"
          >
            Confirmar Renovación
          </button>
        </div>
      </div>
    </div>
  )
}
