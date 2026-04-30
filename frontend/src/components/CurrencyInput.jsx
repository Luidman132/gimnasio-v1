import React from 'react'

// Este es el componente maestro y unificado para todos los cobros del sistema.
// Un solo cambio aqui actualiza el diseno en todo el software.

export function CurrencyInput({ value, onChange, placeholder = '0.00', className }) {

  // Logica inteligente estilo POS/ATM que acomoda los decimales automaticamente
  const handleChange = (e) => {
    // 1. Extraemos solo los digitos numericos
    const valorLimpio = e.target.value.replace(/\D/g, '')

    // 2. Si el input queda vacio, lo limpiamos
    if (!valorLimpio) {
      onChange('')
      return
    }

    // 3. Convertimos el string a numero y lo dividimos entre 100 para crear los decimales reales
    const numero = parseInt(valorLimpio, 10) / 100

    // 4. Lo guardamos en el estado ya formateado con sus 2 decimales fijos
    onChange(numero.toFixed(2))
  }

  // Formatea el valor con separadores de miles para mostrar en el input
  const formatearDisplay = (val) => {
    if (!val) return ''
    const partes = val.toString().split('.')
    partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return partes.join('.')
  }

  return (
    <div className="relative">
      {/* Simbolo de moneda visualmente integrado, con fuente normal */}
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-normal">S/</span>
      <input
        type="text"
        value={formatearDisplay(value)}
        onChange={handleChange}
        placeholder={placeholder}
        className={`pl-10 text-lg font-sans font-normal text-slate-800 tracking-tight ${className || 'w-full bg-slate-50 border border-slate-200 rounded-lg py-3 pr-4 outline-none focus:border-red-500 focus:bg-white transition-colors shadow-sm'}`}
      />
    </div>
  )
}
