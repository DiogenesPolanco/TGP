import { useState } from 'react'
import {
  AlertTriangle,
  Shield,
  Lock,
  Clock,
  Eye,
  Database,
  CheckCircle,
  FileSignature,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Props {
  onAccept: () => void
  onClose: () => void
}

export function TermsModal({ onAccept, onClose }: Props) {
  const [accepted, setAccepted] = useState(false)

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="w-full max-w-2xl max-h-[85vh] bg-card rounded-2xl border border-boundary shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-boundary shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileSignature size={18} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-90 dark:text-white">
                Términos y Condiciones
              </h2>
              <p className="text-xs text-neutral-50">Compartir Datos y Políticas de Privacidad</p>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <p className="text-sm text-secondary leading-relaxed">
              TGP permite generar enlaces públicos para compartir información con personas dentro y
              fuera de la institución. El uso de esta funcionalidad implica la aceptación de los
              términos aquí descritos.
            </p>

            {/* Responsabilidad */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-neutral-90 dark:text-white flex items-center gap-2">
                <AlertTriangle size={16} className="text-danger" />
                Responsabilidad del Usuario
              </h3>
              <ul className="space-y-1.5 text-xs text-muted ml-5 list-disc">
                <li>
                  El usuario es responsable de evaluar qué información comparte. TGP no filtra ni
                  modifica los datos antes de generar un enlace.
                </li>
                <li>
                  No compartas información clasificada, sujeta a regulación (GDPR, LGPD) o que
                  represente un riesgo si es divulgada.
                </li>
                <li>
                  Evita compartir datos personales identificables (nombres, correos, IDs internas)
                  sin autorización.
                </li>
                <li>
                  Planes, OKRs, métricas de equipos, vulnerabilidades y hallazgos de auditoría
                  pueden revelar estrategia institucional o brechas de seguridad.
                </li>
              </ul>
            </div>

            {/* Medidas de Protección */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-neutral-90 dark:text-white flex items-center gap-2">
                <Lock size={16} className="text-success" />
                Medidas de Protección
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  {
                    icon: Lock,
                    text: 'Cifrado opcional AES-GCM 256 con passphrase',
                    color: 'text-success',
                  },
                  {
                    icon: Clock,
                    text: 'Caducidad automática a las 48 horas',
                    color: 'text-warning',
                  },
                  {
                    icon: Database,
                    text: 'Limpieza programada de archivos en Azure',
                    color: 'text-info',
                  },
                  { icon: Eye, text: 'Vistas públicas de solo lectura', color: 'text-info' },
                  {
                    icon: Shield,
                    text: 'Autenticación requerida para generar enlaces',
                    color: 'text-success',
                  },
                ].map(({ icon: Icon, text, color }, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-2 rounded-lg bg-neutral-10 dark:bg-neutral-75"
                  >
                    <Icon size={14} className={`${color} mt-0.5 shrink-0`} />
                    <span className="text-xs text-secondary">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Buenas Prácticas */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-neutral-90 dark:text-white flex items-center gap-2">
                <CheckCircle size={16} className="text-primary" />
                Buenas Prácticas
              </h3>
              <ul className="space-y-1.5 text-xs text-muted ml-5 list-disc">
                <li>Usa contraseña para datos institucionales sensibles.</li>
                <li>Comparte solo la vista necesaria para el receptor.</li>
                <li>Comunica la contraseña por un canal diferente al del enlace.</li>
                <li>
                  Notifica al equipo de seguridad si se comparten datos clasificados por error.
                </li>
              </ul>
            </div>

            {/* Exención */}
            <div className="bg-danger/5 border border-danger/20 rounded-xl p-4 space-y-2">
              <h3 className="text-xs font-bold text-danger flex items-center gap-2">
                <AlertTriangle size={14} />
                Exención de Responsabilidad
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                El usuario asume toda responsabilidad por la información que comparte, el
                cumplimiento de políticas institucionales de protección de datos, y las
                consecuencias de compartir información sensible o clasificada. TGP no será
                responsable por daños derivados del uso indebido de esta funcionalidad.
              </p>
            </div>
          </div>

          {/* Footer: checkbox + button */}
          <div className="border-t border-boundary px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <label className="flex items-start gap-2.5 cursor-pointer flex-1">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-neutral-30 text-primary focus:ring-primary/30 shrink-0"
              />
              <span className="text-xs text-muted leading-relaxed">
                He leído y acepto los términos y condiciones de uso de la funcionalidad de compartir
                datos
              </span>
            </label>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-neutral-50 hover:text-neutral-90 dark:hover:text-white transition-colors"
              >
                Cancelar
              </Button>
              <Button
                onClick={onAccept}
                disabled={!accepted}
                className="px-5 py-2 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 shadow-lg shadow-primary/25"
              >
                Aceptar y Continuar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
