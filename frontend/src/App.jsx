import { useState, useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { apiFetch, guardarSesion, limpiarSesion, usuarioGuardado } from './utils/api'
import DashboardLayout from './components/DashboardLayout'
import DashboardInicio from './components/DashboardInicio'
import LoginView from './components/LoginView'

// Carga diferida: cada vista pesada (gráficos, escáner QR, generación de
// tickets) se descarga solo cuando se abre, no en el arranque.
const MiembrosView = lazy(() => import('./components/MiembrosView'))
const NuevaInscripcionView = lazy(() => import('./components/NuevaInscripcionView'))
const RegistrarAsistenciaView = lazy(() => import('./components/RegistrarAsistenciaView'))
const ReportesView = lazy(() => import('./components/ReportesView'))
const PlanesView = lazy(() => import('./components/PlanesView'))
const ConfiguracionView = lazy(() => import('./components/ConfiguracionView'))

function CargandoVista() {
  return (
    <div className="flex items-center justify-center h-64 text-slate-400 dark:text-slate-500 text-sm">
      Cargando…
    </div>
  )
}

function App() {
  const [usuario, setUsuario] = useState(() => usuarioGuardado())
  const [vistaActiva, setVistaActiva] = useState(() => {
    return localStorage.getItem('tramusa_vista') || 'Inicio'
  })
  const [miembroPreSeleccionado, setMiembroPreSeleccionado] = useState(null)

  // Guardar vista activa en localStorage cada vez que cambie
  useEffect(() => {
    localStorage.setItem('tramusa_vista', vistaActiva)
  }, [vistaActiva])

  // Si el servidor responde 401 (sesión expirada), volver al login
  useEffect(() => {
    const alExpirar = () => setUsuario(null)
    window.addEventListener('tramusa:sesion-expirada', alExpirar)
    return () => window.removeEventListener('tramusa:sesion-expirada', alExpirar)
  }, [])

  function handleLogin(userData, token) {
    guardarSesion(token, userData)
    setUsuario(userData)
    setVistaActiva('Inicio')
    // Avisar al GymContext que ya puede cargar los datos
    window.dispatchEvent(new Event('tramusa:login'))
  }

  function handleLogout() {
    apiFetch('logout.php', { method: 'POST' }) // invalida el token en el servidor
    limpiarSesion()
    setUsuario(null)
    setVistaActiva('Inicio')
    localStorage.removeItem('tramusa_vista')
  }

  if (!usuario) {
    return (
      <Routes>
        <Route path="/login" element={<LoginView onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  function renderContent() {
    switch (vistaActiva) {
      case 'Inicio':
        return <DashboardInicio userName={usuario.nombre} setVistaActiva={setVistaActiva} setMiembroPreSeleccionado={setMiembroPreSeleccionado} />
      case 'Miembros':
        return <MiembrosView usuario={usuario} setVistaActiva={setVistaActiva} miembroPreSeleccionado={miembroPreSeleccionado} setMiembroPreSeleccionado={setMiembroPreSeleccionado} />
      case 'Nueva Inscripcion':
        return <NuevaInscripcionView setVistaActiva={setVistaActiva} />
      case 'Asistencias':
        return <RegistrarAsistenciaView usuario={usuario} miembroPreSeleccionado={miembroPreSeleccionado} setMiembroPreSeleccionado={setMiembroPreSeleccionado} />
      case 'Finanzas':
        return <ReportesView />
      case 'Planes':
        return <PlanesView usuario={usuario} />
      case 'Configuración':
        return <ConfiguracionView />
      default:
        return (
          <div className="p-8 text-slate-500 dark:text-slate-400">
            Vista "{vistaActiva}" en construcción...
          </div>
        )
    }
  }

  return (
    <DashboardLayout
      usuario={usuario}
      onLogout={handleLogout}
      vistaActiva={vistaActiva}
      setVistaActiva={setVistaActiva}
    >
      <Suspense fallback={<CargandoVista />}>
        {renderContent()}
      </Suspense>
    </DashboardLayout>
  )
}

export default App
