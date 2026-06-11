import { useState } from 'react'
import { Dumbbell, Lock, Mail, ArrowRight } from 'lucide-react'
import { apiFetch } from '../utils/api'

export default function LoginView({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const data = await apiFetch('login.php', {
      method: 'POST',
      body: { correo: email, password },
    })

    if (data.success && data.token) {
      onLogin(data.usuario, data.token)
    } else {
      setError(data.mensaje || 'Correo o contraseña incorrectos')
    }
    setIsLoading(false)
  }

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center p-4 relative overflow-hidden bg-center bg-cover bg-no-repeat"
      style={{ backgroundImage: `url('/Fondo Tramusa.jpg')` }}
    >

      {/* Capa de oscurecimiento (Overlay) */}
      <div className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">

        {/* Logo / Cabecera */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-red-600 dark:bg-red-500 rounded-3xl shadow-xl shadow-red-600/20 dark:shadow-red-500/10 flex items-center justify-center mb-5 rotate-3 hover:rotate-6 transition-transform">
            <Dumbbell size={40} className="text-white -rotate-12" />
          </div>
          <h1 className="text-3xl font-black text-white drop-shadow-md tracking-tight">TRAMUSA S.A.</h1>
          <p className="text-red-100/90 dark:text-red-200/80 mt-2 text-sm font-semibold tracking-wide uppercase">Inicia sesión en tu cuenta</p>
        </div>

        {/* Tarjeta de Formulario */}
        <div className="bg-white dark:bg-slate-900 rounded-4xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800/80 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Correo Electrónico
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={18} className="text-slate-400 group-focus-within:text-red-500 transition-colors" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  placeholder="correo@tramusa.pe"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Contraseña
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400 group-focus-within:text-red-500 transition-colors" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium text-sm tracking-widest"
                />
              </div>
            </div>

            {/* Mensaje de error */}
            {error && (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-3 text-sm text-red-600 dark:text-red-400 font-semibold text-center">
                {error}
              </div>
            )}



            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 dark:disabled:bg-red-800 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-full transition-all flex items-center justify-center gap-2 group shadow-md shadow-red-600/20"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  Ingresar
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-white/50 text-xs font-medium mt-8 drop-shadow-sm">
          &copy; {new Date().getFullYear()} Gymnasia Tramusa.<br/>Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}
