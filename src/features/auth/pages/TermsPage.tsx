import { useState } from 'react'
import { Check, X, FileText, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const TERMS_KEY = 'tgp-terms-accepted'
const TERMS_VERSION = 2

export function isTermsAccepted(): boolean {
  return localStorage.getItem(TERMS_KEY) === String(TERMS_VERSION)
}

export function acceptTerms() {
  localStorage.setItem(TERMS_KEY, String(TERMS_VERSION))
}

export function getCurrentTermsVersion(): number {
  return TERMS_VERSION
}

interface Props {
  onAccept: () => void
  onDecline: () => void
}

export function TermsPage({ onAccept, onDecline }: Props) {
  const [accepted, setAccepted] = useState(false)
  const [showFull, setShowFull] = useState(false)

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]" style={{
        background: 'radial-gradient(ellipse 60% 50% at 20% 30%, #0052CC 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 80% 70%, #C85A48 0%, transparent 60%), radial-gradient(ellipse 40% 40% at 50% 50%, #36B37E 0%, transparent 50%)'
      }} />
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />

      <div className="w-full max-w-4xl relative">
        <div className="bg-white/95 dark:bg-neutral-80/95 backdrop-blur-xl rounded-3xl border border-neutral-20/80 dark:border-neutral-70/80 shadow-2xl shadow-neutral-30/30 dark:shadow-black/30 overflow-hidden">
          <div className="flex flex-col lg:flex-row min-h-[520px]">
            <div className="lg:w-[42%] bg-gradient-to-br from-primary via-primary-dark to-[#03245E] p-8 lg:p-10 text-white flex flex-col relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{
                background: 'radial-gradient(circle at 30% 40%, white 0%, transparent 60%), radial-gradient(circle at 70% 80%, #4C9AFF 0%, transparent 50%)'
              }} />
              <div className="relative flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-sm">
                  <img src="/favicon.svg" alt="TGP" className="w-full h-full" />
                </div>
                <div>
                  <p className="text-xl font-bold tracking-tight">TGP</p>
                  <p className="text-[11px] font-medium opacity-60 tracking-wide">Technology Governance Platform</p>
                </div>
              </div>
              <div className="relative flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={16} />
                  <span className="text-xs font-medium uppercase tracking-widest opacity-60">Términos y Condiciones</span>
                </div>
                <h2 className="text-3xl font-bold leading-tight mb-4">
                  Antes de<br />comenzar
                </h2>
                <p className="text-base leading-relaxed opacity-85 mb-5">
                  TGP es una herramienta gratuita de gobierno tecnológico. 
                  Al usarla, aceptas los términos descritos al lado.
                </p>
                <ul className="space-y-3 text-base">
                  {['Sin costo · Sin licencias', '100% cliente-side', 'Tus datos, tu responsabilidad', 'Código abierto'].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check size={16} className="mt-0.5 shrink-0 opacity-70" />
                      <span className="opacity-90">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative mt-6 pt-4 border-t border-white/15">
                <p className="text-sm opacity-60 leading-relaxed">Versión 2.0 · Junio 2026</p>
              </div>
            </div>

            <div className="hidden lg:block w-5 bg-white/95 dark:bg-neutral-80/95 relative">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="w-2.5 h-2.5 rounded-full bg-neutral-20 dark:bg-neutral-70" />
                ))}
              </div>
            </div>

            <div className="lg:w-[58%] p-8 lg:p-10 bg-white/95 dark:bg-neutral-80/95 flex flex-col justify-center">
              <div className="max-w-lg mx-auto w-full space-y-5">
                <div>
                  <h3 className="text-xl font-bold text-neutral-90 dark:text-white">Términos de Uso</h3>
                  <p className="text-sm text-muted mt-1">
                    Leé atentamente antes de continuar
                  </p>
                </div>

                <div className="bg-neutral-5 dark:bg-neutral-85 rounded-xl p-4 border border-boundary max-h-[320px] overflow-y-auto text-sm text-secondary leading-relaxed space-y-3">
                  <p><strong>1. Naturaleza del servicio.</strong> TGP es una herramienta de gobierno tecnológico gratuita, sin garantías explícitas ni implícitas. Se proporciona "tal cual" y bajo tu propio riesgo.</p>
                  
                  <p><strong>2. Almacenamiento de datos.</strong> Toda la información se almacena localmente en el navegador del usuario mediante IndexedDB. No contamos con servidores propios ni almacenamos datos en infraestructura controlada por nosotros. Eres el único responsable de respaldar y proteger tu información.</p>
                  
                  <p><strong>3. Servicios en la nube (Azure).</strong> Si activas la funcionalidad de backup o uso compartido mediante Azure Blob Storage, los datos viajarán y se almacenarán en infraestructura de Microsoft Azure bajo tu propia configuración y credenciales. No nos responsabilizamos por exposiciones, filtraciones o pérdidas derivadas del uso de estos servicios externos.</p>
                  
                  <p><strong>4. Pérdida de datos.</strong> No garantizamos la integridad ni disponibilidad de tus datos. Si actualizas el navegador, eliminas la aplicación, limpias el almacenamiento local, o ocurre cualquier evento que afecte el entorno del cliente, podrías perder toda la información registrada. Es tu responsabilidad mantener copias de seguridad periódicas.</p>
                  
                  <p><strong>5. Actualizaciones.</strong> El sistema puede detectar nuevas versiones y solicitar una recarga para aplicar cambios. No nos hacemos responsables por inconsistencias o pérdidas durante el proceso de actualización.</p>
                  
                  <p><strong>6. Ausencia de garantía.</strong> TGP es una solución de código abierto, sin soporte oficial ni garantía de funcionamiento en todos los entornos. El equipo de desarrollo no asume responsabilidad por daños directos o indirectos derivados del uso de la herramienta.</p>
                  
                  <p><strong>7. Privacidad y flujo de datos.</strong> No recolectamos, transmitimos ni procesamos datos personales en infraestructura propia. Todo el uso queda bajo tu control de la siguiente manera:</p>
                  <ul className="pl-4 space-y-1 text-xs text-muted list-disc ml-1">
                    <li><strong>Almacenamiento local (IndexedDB):</strong> Todos los datos de la aplicación se almacenan exclusivamente en tu navegador. No se envían a servidores externos a menos que tú configures explícitamente un servicio de backup o sharing.</li>
                    <li><strong>Backup en Azure:</strong> Si configuras la funcionalidad de backup, toda la base de datos se exporta y almacena en Azure Blob Storage bajo tu propia SAS URL y container. Tú controlas cuándo y cómo se realiza el backup.</li>
                    <li><strong>Sharing (enlaces públicos):</strong> Si compartes datos mediante enlaces públicos, la información viaja cifrada (AES-GCM 256) a Azure Blob Storage o se almacena localmente. La duración y visibilidad del enlace son configurables.</li>
                    <li><strong>Importación de datos:</strong> Los archivos Excel que importes se procesan íntegramente en tu navegador. No se transmiten ni almacenan en servidores externos.</li>
                  </ul>
                  <p className="text-xs text-muted">Eres responsable de revisar y gestionar estas configuraciones según las políticas de tu institución.</p>
                  
                  <p><strong>8. Inteligencia Artificial.</strong> Este sistema fue desarrollado con asistencia de inteligencia artificial generativa. La IA se utilizó como herramienta de apoyo en la generación y revisión de código durante el desarrollo. TGP no incorpora modelos de IA en su ejecución cliente-side — no se recolectan datos para entrenamiento, no hay inferencia en la nube, y todo procesamiento ocurre localmente en tu navegador. El contenido que ingreses, las decisiones que tomes basado en la información del sistema, y el uso que le des a la herramienta son responsabilidad exclusiva tuya.</p>
                  
                  <p><strong>9. Copyright y contenido del usuario.</strong> Eres el único responsable del contenido que ingresas, importas o compartes en TGP. TGP no reclama propiedad intelectual sobre los datos, textos, métricas o configuraciones que registres en el sistema. Declaras y garantizas que cuentas con los derechos necesarios sobre la información que ingresas, incluyendo pero no limitado a datos institucionales, métricas de equipos, OKRs, hallazgos de auditoría y cualquier otro contenido. TGP no será responsable por infracciones de derechos de autor, propiedad intelectual o confidencialidad derivadas del contenido ingresado por los usuarios.</p>
                  
                  {showFull && (
                    <>
                      <p><strong>10. Modificaciones.</strong> Nos reservamos el derecho de modificar estos términos en cualquier momento. El uso continuado de la herramienta después de los cambios constituye la aceptación de los nuevos términos.</p>
                      <p><strong>11. Contacto.</strong> Para consultas, reportes o sugerencias, puedes abrir un issue en el repositorio oficial del proyecto.</p>
                    </>
                  )}
                  <Button variant="ghost" size="sm" className="p-0 text-primary hover:underline hover:bg-transparent"
                    onClick={() => setShowFull(!showFull)}>
                    {showFull ? 'Mostrar menos' : 'Leer términos completos'} <ExternalLink size={12} className="inline" />
                  </Button>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-neutral-30 text-primary focus:ring-primary/25 accent-primary" />
                  <span className="text-sm text-secondary leading-relaxed">
                    He leído y acepto los <span className="text-primary font-medium">términos y condiciones</span> de TGP
                  </span>
                </label>

                <div className="flex items-center gap-3 pt-2">
                  <Button onClick={onDecline} variant="secondary" className="flex-1 rounded-xl">
                    <X size={18} />
                    No acepto
                  </Button>
                  <Button onClick={onAccept} disabled={!accepted} variant="primary" className="flex-1 rounded-xl shadow-lg shadow-primary/25 bg-primary text-white hover:bg-primary/90">
                    <Check size={18} />
                    Aceptar y continuar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
