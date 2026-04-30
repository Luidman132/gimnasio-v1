import { useState, useEffect, useRef } from 'react'
import { Building2, Save, Loader2, ImagePlus, Trash2, MessageCircle } from 'lucide-react'
import { inputClasses } from '../utils/constants'
import { useToast } from '../context/ToastContext'
import { useGym } from '../context/GymContext'

export default function ConfiguracionView() {
  const { mostrarToast } = useToast()
  const { configuracion, guardarConfiguracion } = useGym()
  const [guardando, setGuardando] = useState(false)
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    nombre_gimnasio: '',
    moneda: 'S/',
    direccion: '',
    telefono: '',
    mensaje_ticket: '',
    logo_base64: null,
    plantilla_whatsapp: '',
  })

  // Sincronizar con el contexto cuando cargue la config de la BD
  useEffect(() => {
    if (configuracion) {
      setForm({
        nombre_gimnasio: configuracion.nombre_gimnasio || '',
        moneda: configuracion.moneda || 'S/',
        direccion: configuracion.direccion || '',
        telefono: configuracion.telefono || '',
        mensaje_ticket: configuracion.mensaje_ticket || '',
        logo_base64: configuracion.logo_base64 || null,
        plantilla_whatsapp: configuracion.plantilla_whatsapp || '',
      })
    }
  }, [configuracion])

  function handleLogoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 500 * 1024) {
      mostrarToast('La imagen no debe superar los 500KB', 'error')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setForm(prev => ({ ...prev, logo_base64: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  function eliminarLogo() {
    setForm(prev => ({ ...prev, logo_base64: null }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleGuardar(e) {
    e.preventDefault()
    if (!form.nombre_gimnasio.trim()) {
      mostrarToast('El nombre del gimnasio es obligatorio', 'error')
      return
    }
    setGuardando(true)
    const result = await guardarConfiguracion(form)
    setGuardando(false)
    if (result.success) {
      mostrarToast('Configuracion guardada con exito')
    } else {
      mostrarToast(result.mensaje || 'Error al guardar', 'error')
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto pb-12">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight mb-6">Configuracion del Sistema</h2>

      <form onSubmit={handleGuardar} className="space-y-6">

        {/* TARJETA 1: DATOS DEL NEGOCIO */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Building2 size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Datos del Negocio (Tickets y Recibos)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nombre Oficial <span className="text-red-400">*</span></label>
              <input type="text" name="nombre_gimnasio" value={form.nombre_gimnasio} onChange={handleChange} className={inputClasses} placeholder="Ej: Mi Gimnasio S.A." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Moneda Principal</label>
              <select name="moneda" value={form.moneda} onChange={handleChange} className={inputClasses}>
                <option value="S/">Soles (S/)</option>
                <option value="$">Dólares ($)</option>
                <option value="€">Euros (€)</option>
                <option value="Bs.">Bolivianos (Bs.)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Direccion Local</label>
              <input type="text" name="direccion" value={form.direccion} onChange={handleChange} className={inputClasses} placeholder="Ej: Av. Principal 123, Ciudad" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Telefono / WhatsApp de Contacto</label>
              <input type="text" name="telefono" value={form.telefono} onChange={handleChange} className={inputClasses} placeholder="+51 999 888 777" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Mensaje al pie del ticket</label>
              <input type="text" name="mensaje_ticket" value={form.mensaje_ticket} onChange={handleChange} placeholder="Ej: Gracias por tu preferencia!" className={inputClasses} />
            </div>
          </div>
        </div>

        {/* TARJETA 2: LOGO DEL NEGOCIO */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <ImagePlus size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Logo del Negocio</h3>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Vista previa */}
            <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-800/50 shrink-0">
              {form.logo_base64 ? (
                <img src={form.logo_base64} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <span className="text-xs text-slate-400 dark:text-slate-500 text-center px-2">Sin logo</span>
              )}
            </div>

            <div className="flex-1 space-y-3">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Sube el logo de tu gimnasio. Se mostrara en el sidebar y en los tickets. <span className="font-semibold">Max. 500KB.</span>
              </p>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center gap-2"
                >
                  <ImagePlus size={16} />
                  {form.logo_base64 ? 'Cambiar Logo' : 'Subir Logo'}
                </button>
                {form.logo_base64 && (
                  <button
                    type="button"
                    onClick={eliminarLogo}
                    className="bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-500/20 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    Quitar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* TARJETA 3: PLANTILLA WHATSAPP */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center">
              <MessageCircle size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Plantilla de WhatsApp (Vencimientos)</h3>
          </div>

          <div className="space-y-4">
            <textarea
              name="plantilla_whatsapp"
              value={form.plantilla_whatsapp}
              onChange={handleChange}
              rows={4}
              placeholder="Ej: ¡Hola *[NOMBRE]*! Te escribimos de *[GIMNASIO]* para recordarte que tu plan [PLAN] [DIAS]. ¡Te esperamos!"
              className={`${inputClasses} resize-none`}
            />
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Variables disponibles</p>
              <div className="flex flex-wrap gap-2">
                {['[NOMBRE]', '[PLAN]', '[DIAS]', '[FECHA_FIN]', '[GIMNASIO]'].map(v => (
                  <span key={v} className="bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20 px-2.5 py-1 rounded-lg text-xs font-mono font-bold">{v}</span>
                ))}
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                Estas variables se reemplazan automaticamente con los datos del miembro al enviar el mensaje.
              </p>
            </div>
          </div>
        </div>

        {/* BOTON GUARDAR */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={guardando}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-3 px-8 rounded-xl transition-colors shadow-sm flex items-center gap-2"
          >
            {guardando ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {guardando ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>

      </form>
    </div>
  )
}
