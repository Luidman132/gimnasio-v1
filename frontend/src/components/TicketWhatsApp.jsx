import { useRef } from 'react';
import { CheckCircle, Receipt, User, CreditCard, Send, Download, X } from 'lucide-react';
import { toPng } from 'html-to-image';
import QRCode from 'react-qr-code';

export function TicketWhatsApp({ ticket, onClose }) {
  const ticketRef = useRef(null);

  if (!ticket) return null;

  // Generar ID dinámico basado en las primeras 4 letras del nombre
  const clienteId = ticket.cliente
    .replace(/\s+/g, '')
    .substring(0, 4)
    .toUpperCase();

  const descargarBoleta = async () => {
    if (!ticketRef.current) return;

    try {
      const dataUrl = await toPng(ticketRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        filter: (node) => {
          return !node.dataset?.html2canvasIgnore;
        }
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `Tramusa_Boleta_${ticket.cliente.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error al generar la boleta con html-to-image:", err);
      alert("Hubo un problema al descargar la boleta. Inténtalo de nuevo.");
    }
  };

  const enviarPorWhatsApp = () => {
    const mensaje = `¡Hola ${ticket.cliente}! 👋\n\nConfirmamos tu pago exitoso en *TRAMUSA S.A.*\n\n📄 *Concepto:* ${ticket.operacion}\n💰 *Monto:* S/ ${ticket.monto} PEN\n📅 *Fecha:* ${ticket.fecha}\n\n¡Gracias por tu preferencia! 💪`;
    const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6">
      {/* Contenedor simulando un teléfono móvil */}
      <div ref={ticketRef} className="bg-slate-50 rounded-4xl shadow-2xl w-full max-w-100 overflow-hidden flex flex-col max-h-[90vh] border-[6px] border-white">

        {/* Contenido escroleable */}
        <div className="p-6 overflow-y-auto relative flex-1">
          <button data-html2canvas-ignore="true" onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 shadow-sm transition-colors z-10 cursor-pointer">
            <X size={20} />
          </button>

          {/* Logo y Nombre Empresa */}
          <div className="flex items-center justify-center gap-3 mb-6 mt-4">
            <img src="/logo-tramusa.png" alt="Tramusa Logo" className="w-14 object-contain" />
            <div className="text-left">
              <h2 className="font-black text-slate-800 text-lg leading-tight tracking-tight">TRAMUSA S.A.</h2>
              <p className="text-[9px] font-bold text-slate-500 tracking-wider">ES MACHUPICCHU Y SUS COMUNIDADES.</p>
            </div>
          </div>

          {/* Estado de pago */}
          <div className="flex flex-col items-center justify-center mb-8">
            <CheckCircle size={44} className="text-emerald-500 mb-2 drop-shadow-sm" />
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">¡Pago Exitoso!</h3>
            <p className="text-xs font-medium text-slate-400">{ticket.fecha}</p>
          </div>

          {/* Datos de la Membresía */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 mb-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3 border-b border-slate-50 pb-2">
              <Receipt size={16} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-700 tracking-wide">DATOS DE LA MEMBRESÍA</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-start gap-4">
                <span className="text-slate-500 text-xs">Concepto</span>
                <span className="font-semibold text-slate-800 text-right text-sm">{ticket.operacion}</span>
              </div>
            </div>
          </div>

          {/* Datos del Miembro y QR */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 mb-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3 border-b border-slate-50 pb-2">
              <User size={16} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-700 tracking-wide">DATOS DEL MIEMBRO</span>
            </div>
            <div className="flex items-center gap-4 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                <div className="w-[54px] h-[54px]">
                  <QRCode
                    value={`TRAMUSA-${clienteId}-2026`}
                    size={54}
                    level="H"
                    bgColor="#ffffff"
                    fgColor="#1e293b"
                  />
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">Escanear para Ingreso</p>
                <p className="text-sm font-bold text-slate-800">ID: {clienteId}-2026</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 text-xs">Nombre</span>
                <span className="font-semibold text-slate-800">{ticket.cliente}</span>
              </div>
            </div>
          </div>

          {/* Detalle de Pago */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3 border-b border-slate-50 pb-2">
              <CreditCard size={16} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-700 tracking-wide">DETALLE DE PAGO</span>
            </div>
            <div className="flex justify-between items-center mt-3 bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <span className="text-slate-600 text-sm font-medium">Monto Pagado</span>
              <span className="font-black text-2xl text-emerald-700 tracking-tight">S/ {ticket.monto} <span className="text-sm font-bold text-emerald-500">PEN</span></span>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div data-html2canvas-ignore="true" className="p-4 bg-white border-t border-slate-100 flex gap-3 z-10 rounded-b-4xl">
          <button onClick={descargarBoleta} className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm cursor-pointer">
            <Download size={18} /> Boleta
          </button>
          <button onClick={enviarPorWhatsApp} className="flex-2 bg-[#25D366] hover:bg-[#1DA851] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm shadow-md shadow-green-500/20 cursor-pointer">
            <Send size={18} /> WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
