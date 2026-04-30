import { useState } from 'react'
import { X } from 'lucide-react'
import { inputClasses, inputErrorClasses } from '../../utils/constants'
import { useToast } from '../../context/ToastContext'

export default function ModalEditarCliente({ cliente, onGuardar, onCerrar }) {
  const { mostrarToast } = useToast()
  const [nombre, setNombre] = useState(cliente.nombre)
  const [dni, setDni] = useState(cliente.dni || '')
  const [errorNombre, setErrorNombre] = useState(false)

  function handleGuardar() {
    if (!nombre.trim()) {
      setErrorNombre(true)
      mostrarToast('El nombre no puede estar vacío', 'error')
      return
    }
    onGuardar(nombre, dni)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-transparent dark:border-slate-800">
        <div className="bg-slate-50 dark:bg-slate-800 p-6 flex items-center justify-between border-b border-transparent dark:border-slate-800/50">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Editar Cliente</h3>
          <button
            type="button"
            onClick={onCerrar}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Nombre Completo</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => { setNombre(e.target.value); setErrorNombre(false) }}
              className={errorNombre ? inputErrorClasses : inputClasses}
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">DNI</label>
            <input
              type="text"
              value={dni}
              onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
              maxLength={8}
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
            onClick={handleGuardar}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 px-6 font-semibold transition-colors"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  )
}
