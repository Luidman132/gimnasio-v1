import { useState } from 'react'
import { X } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { CurrencyInput } from '../CurrencyInput'

export default function ModalPaseTemporal({ cliente, onProcesar, onCerrar }) {
  const { mostrarToast } = useToast()
  const [diasPase, setDiasPase] = useState(1)
  const [monto, setMonto] = useState('')

  function handleProcesar(registrarIngreso) {
    if (!monto || parseFloat(monto) <= 0) {
      mostrarToast('Ingresa el monto del pase', 'error')
      return
    }
    onProcesar(diasPase, monto, registrarIngreso)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-transparent dark:border-slate-800">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 flex items-center justify-between border-b border-transparent dark:border-slate-800/50">
          <div>
            <h3 className="text-lg font-bold text-blue-800 dark:text-blue-300">Vender Pase Temporal</h3>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">{cliente.nombre}</p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800/50 text-blue-400 dark:text-blue-500 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
          >
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
                  type="button"
                  onClick={() => setDiasPase(n)}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                    diasPase === n
                      ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {n} Día{n > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Monto</label>
            <CurrencyInput value={monto} onChange={setMonto} />
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
            onClick={() => handleProcesar(false)}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 border border-emerald-600 dark:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
          >
            Solo Cobrar
          </button>
          <button
            type="button"
            onClick={() => handleProcesar(true)}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors shadow-sm"
          >
            Cobrar y Registrar Ingreso
          </button>
        </div>
      </div>
    </div>
  )
}
