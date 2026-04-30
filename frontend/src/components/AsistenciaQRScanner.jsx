import { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { X, QrCode, AlertTriangle } from 'lucide-react';

export function AsistenciaQRScanner({ onClose, onScanValid }) {
  const [pausado, setPausado] = useState(false)
  const [errorCamara, setErrorCamara] = useState(false)

  const handleScanSuccess = (results) => {
    if (pausado) return
    if (results && results[0] && results[0].rawValue) {
      const scannedData = results[0].rawValue;
      setPausado(true)
      onScanValid(scannedData);
      // Reanudar escaneo después de 3 segundos
      setTimeout(() => setPausado(false), 3000)
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6 transition-opacity duration-300">

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-[380px] overflow-hidden flex flex-col max-h-[90vh] border-[6px] border-white dark:border-slate-800 relative transition-transform duration-300">

        {/* Botón cerrar */}
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-white dark:bg-slate-800 rounded-full p-1 shadow-sm transition-colors z-110 cursor-pointer">
          <X size={20} />
        </button>

        {/* Encabezado */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 rounded-t-[2rem]">
          <div className="flex items-center gap-3 justify-center">
            <div className="bg-emerald-100 dark:bg-emerald-500/10 p-2.5 rounded-2xl border border-emerald-200 dark:border-emerald-500/20 shadow-inner">
              <QrCode size={24} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-center">
              <h2 className="font-extrabold text-slate-800 dark:text-slate-100 text-xl leading-tight tracking-tight">Escanear Asistencia</h2>
              <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Acerca el QR del Miembro a la Cámara</p>
            </div>
          </div>
        </div>

        {/* Contenedor de la Cámara */}
        <div className="p-5 flex-1 flex items-center justify-center relative">
          {errorCamara ? (
            <div className="w-full aspect-square flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 text-center">
              <AlertTriangle size={48} className="text-amber-500 mb-4" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">No se pudo acceder a la cámara</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Verifica que hayas dado permiso de cámara al navegador e intenta de nuevo.</p>
            </div>
          ) : (
            <>
              {/* Viewfinder decorativo */}
              <div className={`absolute inset-x-8 inset-y-10 border-4 rounded-2xl z-10 opacity-70 border-dashed pointer-events-none transition-colors ${pausado ? 'border-amber-400' : 'border-emerald-500 animate-pulse'}`}></div>

              {/* Indicador de procesando */}
              {pausado && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 rounded-2xl">
                  <p className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm px-4 py-2 rounded-full shadow-lg">Procesando...</p>
                </div>
              )}

              {/* Cámara real */}
              <div className="w-full h-full rounded-2xl overflow-hidden shadow-inner border border-slate-100 dark:border-slate-700 aspect-square">
                <Scanner
                  onScan={handleScanSuccess}
                  paused={pausado}
                  styles={{ container: { width: '100%', height: '100%' } }}
                  constraints={{ facingMode: 'environment' }}
                  onError={(error) => {
                    console.error("Error al iniciar la cámara:", error)
                    setErrorCamara(true)
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* Pie de página */}
        <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 rounded-b-[2rem]">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 tracking-tight">Asegúrate de tener buena iluminación para un escaneo rápido.</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Lector de QR v1.0 | Tramusa Gym</p>
        </div>

      </div>
    </div>
  );
}
