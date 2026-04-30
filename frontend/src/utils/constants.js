export const inputClasses = 'w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-100 dark:focus:ring-red-500/20 focus:border-red-400 dark:focus:border-red-500 transition-all custom-scrollbar'

export const inputErrorClasses = 'w-full bg-red-50 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 rounded-lg py-2.5 px-4 text-sm text-slate-700 dark:text-slate-200 placeholder:text-red-300 dark:placeholder:text-red-400/50 focus:outline-none focus:ring-2 focus:ring-red-200 dark:focus:ring-red-500/20 focus:border-red-400 dark:focus:border-red-500 transition-all'

export const inputReadOnly = 'w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed'


export const estilosEstado = {
  activo: {
    contenedor: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
    texto: 'text-emerald-800 dark:text-emerald-400',
    titulo: 'Acceso Permitido',
  },
  vencido: {
    contenedor: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20',
    texto: 'text-red-800 dark:text-red-400',
    titulo: 'Suscripción Vencida',
  },
  pase_activo: {
    contenedor: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
    texto: 'text-blue-900 dark:text-blue-400',
    titulo: 'PASE TEMPORAL ACTIVO',
  },
}
