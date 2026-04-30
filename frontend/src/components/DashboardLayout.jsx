import { useState, useEffect, useRef } from 'react'
import { Home, Users, CalendarCheck, DollarSign, LayoutList, Settings, Bell, Check, BellOff, Sun, Moon, LogOut, Menu, X } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useGym } from '../context/GymContext'

const logoTramusa = '/logo_empresa_tramusa.svg'

export const menuItems = [
  { icon: Home, label: 'Inicio', roles: ['admin', 'recepcion'] },
  { icon: Users, label: 'Miembros', roles: ['admin', 'recepcion'] },
  { icon: CalendarCheck, label: 'Asistencias', roles: ['admin', 'recepcion'] },
  { icon: DollarSign, label: 'Finanzas', roles: ['admin'] },
  { icon: LayoutList, label: 'Planes', roles: ['admin'] },
  { icon: Settings, label: 'Configuración', roles: ['admin'] },
]

function formatDateTime(date) {
  const day = date.getDate()
  const month = date.toLocaleDateString('es-ES', { month: 'short' })
  const year = date.getFullYear()
  const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true })
  return `${day} ${month} ${year} • ${time}`
}

export default function DashboardLayout({ children, usuario, onLogout, vistaActiva, setVistaActiva }) {
  const { darkMode, toggleDarkMode } = useTheme()
  const { configuracion, miembros } = useGym()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notificaciones, setNotificaciones] = useState([])
  const dropdownRef = useRef(null)

  const rolNormalizado = usuario?.rol?.toLowerCase()
  const filteredMenu = menuItems.filter(item => item.roles.includes(rolNormalizado))
  const isHome = vistaActiva === 'Inicio'

  const noLeidas = notificaciones.filter((n) => !n.leido).length
  const leidasRef = useRef(new Set())

  useEffect(() => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const alertas = miembros
      .filter(m => m.estado !== 'inactivo' && m.estado !== 'congelado' && m.fin)
      .map(m => {
        const limpio = m.fin.split(' ')[0]
        const [y, mo, d] = limpio.includes('-') ? limpio.split('-') : (() => { const p = limpio.split('/'); return [p[2], p[1], p[0]] })()
        const fechaFin = new Date(y, mo - 1, d)
        const diff = Math.ceil((fechaFin - hoy) / (1000 * 60 * 60 * 24))
        return { ...m, diasRestantes: diff }
      })
      .filter(m => m.diasRestantes >= 0 && m.diasRestantes <= 3)
      .sort((a, b) => a.diasRestantes - b.diasRestantes)
      .map(m => {
        const textoVence = m.diasRestantes === 0
          ? 'vence HOY'
          : m.diasRestantes === 1
            ? 'vence MAÑANA'
            : `vence en ${m.diasRestantes} días`

        return {
          id: `venc-${m.id}`,
          tipo: m.diasRestantes <= 1 ? 'danger' : 'warning',
          texto: `${m.nombre} — ${m.plan} ${textoVence}`,
          leido: leidasRef.current.has(`venc-${m.id}`),
        }
      })

    setNotificaciones(alertas)
  }, [miembros])

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function marcarComoLeido(id) {
    leidasRef.current.add(id)
    setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, leido: true } : n)))
  }

  function marcarTodasLeidas() {
    setNotificaciones((prev) => {
      prev.forEach(n => leidasRef.current.add(n.id))
      return prev.map((n) => ({ ...n, leido: true }))
    })
  }

  function navegarA(label) {
    setVistaActiva(label)
    setMenuAbierto(false)
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors">

      {/* OVERLAY OSCURO PARA MÓVILES */}
      {menuAbierto && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      {/* SIDEBAR NAVEGACIÓN (Responsivo) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] dark:shadow-none transform transition-transform duration-300 ease-in-out
        ${menuAbierto ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 flex flex-col
      `}>
        {/* Cabecera del Sidebar con Logo */}
        <div className="px-6 py-8 flex items-center justify-between">
          <img src={configuracion.logo_base64 || logoTramusa} alt={configuracion.nombre_gimnasio || 'Tramusa Gym'} className="w-auto h-36 object-contain" />
          {/* Botón cerrar solo visible en móvil */}
          <button
            onClick={() => setMenuAbierto(false)}
            className="md:hidden text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        {/* Lista de navegación */}
        <nav className="flex-1 px-4 overflow-y-auto">
          <ul className="space-y-1">
            {filteredMenu.map((item) => (
              <li key={item.label}>
                <button
                  onClick={() => navegarA(item.label)}
                  className={`w-full text-left py-2.5 px-4 rounded-2xl text-sm transition-all flex items-center gap-3 cursor-pointer ${
                    vistaActiva === item.label
                      ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 font-semibold'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 mt-auto border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-sm shrink-0">
              {usuario.nombre.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{usuario.nombre}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 capitalize">{usuario.rol}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 transition-all cursor-pointer"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col w-full h-screen overflow-hidden">

        {/* TOPBAR PARA MÓVILES */}
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuAbierto(true)}
              className="text-slate-600 dark:text-slate-400 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <Menu size={24} />
            </button>
            <span className="font-bold text-slate-800 dark:text-slate-100">TRAMUSA S.A.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {/* Notificaciones móvil */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <Bell size={18} />
                {noLeidas > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* HEADER PARA DESKTOP */}
        <header className="hidden md:flex bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none dark:border dark:border-slate-800 px-8 py-5 items-center justify-between transition-colors mx-6 mt-6">
          <h2 className="text-slate-800 dark:text-slate-100 text-lg font-semibold">
            {isHome ? 'Panel Principal' : vistaActiva}
          </h2>

          <div className="flex items-center gap-5">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Hola, <span className="text-slate-700 dark:text-slate-200 font-semibold">{usuario.nombre}</span>
            </span>

            <span className="text-lg font-semibold text-slate-700 dark:text-slate-300">
              {formatDateTime(currentTime)}
            </span>

            <button
              onClick={toggleDarkMode}
              className="relative p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all hover:scale-105"
              aria-label="Alternar modo oscuro"
            >
              {darkMode ? <Sun size={20} className="animate-[themeSpin_0.5s_ease-out]" /> : <Moon size={20} className="animate-[themeSpin_0.5s_ease-out]" />}
            </button>

            {/* Notificaciones desktop */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <Bell size={20} />
                {noLeidas > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute top-full right-0 mt-3 w-80 z-50 bg-white dark:bg-slate-900 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 dark:border-slate-800 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Notificaciones</h3>
                    {noLeidas > 0 && (
                      <button
                        onClick={marcarTodasLeidas}
                        className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                      >
                        Marcar todas como leídas
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto">
                    {notificaciones.filter((n) => !n.leido).length === 0 ? (
                      <div className="px-5 py-8 flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
                        <BellOff size={24} />
                        <span className="text-sm">No hay alertas pendientes</span>
                      </div>
                    ) : (
                      notificaciones
                        .filter((n) => !n.leido)
                        .map((n) => (
                          <div
                            key={n.id}
                            className="px-5 py-3.5 border-b border-slate-50 dark:border-slate-800/50 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                          >
                            <span
                              className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                                n.tipo === 'danger' ? 'bg-red-500' : 'bg-amber-500'
                              }`}
                            />
                            <p className="text-sm text-slate-700 dark:text-slate-300 flex-1">{n.texto}</p>
                            <button
                              onClick={() => marcarComoLeido(n.id)}
                              className="shrink-0 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                            >
                              <Check size={14} />
                            </button>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTENEDOR DE LA VISTA ACTIVA (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </div>
      </main>

      {!isHome && (
        <button
          onClick={() => navegarA('Inicio')}
          className="fixed bottom-8 right-8 z-50 flex items-center gap-2 bg-red-600 text-white px-5 py-3 rounded-full font-medium shadow-lg shadow-red-600/20 dark:shadow-none hover:-translate-y-1 hover:shadow-xl hover:bg-red-700 transition-all duration-300 cursor-pointer"
        >
          <Home size={18} />
          Inicio
        </button>
      )}
    </div>
  )
}
