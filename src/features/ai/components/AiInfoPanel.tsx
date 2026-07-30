import { Bot, Shield, RefreshCw, Cloud, Trash2 } from 'lucide-react'

function InfoItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-neutral-5 dark:bg-neutral-85">
      <div className="w-8 h-8 rounded-lg bg-card border border-boundary flex items-center justify-center shrink-0 text-muted">{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-neutral-90 dark:text-white">{title}</p>
        <p className="text-sm text-muted mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

interface Props {
  onRemove: () => void
}

export function AiInfoPanel({ onRemove }: Props) {
  return (
    <div className="bg-card rounded-xl border border-boundary overflow-hidden">
      <div className="px-5 py-3.5 border-b border-boundary flex items-center gap-2">
        <span className="text-base leading-none">ℹ️</span>
        <h2 className="text-sm font-semibold text-neutral-90 dark:text-white">Información</h2>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoItem icon={<Bot size={15} />} title="Datos locales" desc="Con Ollama los datos nunca salen de tu navegador." />
          <InfoItem icon={<Shield size={15} />} title="API Key cifrada" desc="Se guarda cifrada en localStorage de tu navegador." />
          <InfoItem icon={<RefreshCw size={15} />} title="Sin pérdida de permisos" desc="Cambiá de proveedor sin perder la configuración de permisos." />
          <InfoItem icon={<Cloud size={15} />} title="Proveedores cloud" desc="Los datos se envían al API pero no se almacenan." />
        </div>
        <div className="mt-4 pt-4 border-t border-boundary">
          <button onClick={onRemove} className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-muted hover:text-danger hover:bg-danger/5 transition-colors">
            <Trash2 size={14} />
            Desconectar asistente
          </button>
        </div>
      </div>
    </div>
  )
}
