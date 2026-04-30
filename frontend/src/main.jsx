import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GymProvider } from './context/GymContext'
import { ToastProvider } from './context/ToastContext'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <GymProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </GymProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
