import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from './components/DashboardLayout'
import DashboardInicio from './components/DashboardInicio'
import MiembrosView from './components/MiembrosView'
import NuevaInscripcionView from './components/NuevaInscripcionView'
import RegistrarAsistenciaView from './components/RegistrarAsistenciaView'
import ReportesView from './components/ReportesView'
import PlanesView from './components/PlanesView'
import ConfiguracionView from './components/ConfiguracionView'
import LoginView from './components/LoginView'

function App() {
  const [usuario, setUsuario] = useState(() => {
    const saved = localStorage.getItem('tramusa_usuario')
    return saved ? JSON.parse(saved) : null
  })
  const [vistaActiva, setVistaActiva] = useState(() => {
    return localStorage.getItem('tramusa_vista') || 'Inicio'
  })
  const [miembroPreSeleccionado, setMiembroPreSeleccionado] = useState(null)

  // Guardar vista activa en localStorage cada vez que cambie
  useEffect(() => {
    localStorage.setItem('tramusa_vista', vistaActiva)
  }, [vistaActiva])

  function handleLogin(userData) {
    setUsuario(userData)
    setVistaActiva('Inicio')
    localStorage.setItem('tramusa_usuario', JSON.stringify(userData))
  }

  function handleLogout() {
    setUsuario(null)
    setVistaActiva('Inicio')
    localStorage.removeItem('tramusa_usuario')
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
      {renderContent()}
    </DashboardLayout>
  )
}

export default App
