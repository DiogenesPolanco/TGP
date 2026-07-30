import { useState } from 'react'
import { Check, X, FileText, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { AuthBrandPanel, PerforatedDivider } from '../components/loginComponents'

const TERMS_KEY = 'tgp-terms-accepted'
const TERMS_VERSION = 3

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
    <div className="min-h-screen font-sans relative overflow-hidden" style={{ background: '#080c14', color: '#c8d0e0' }}>
      {/* Grid verde estilo landing */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{ backgroundImage: 'linear-gradient(rgba(0,255,136,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.04) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      <div className="fixed top-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full pointer-events-none z-0" style={{ background: 'radial-gradient(circle, rgba(0,255,136,0.06) 0%, transparent 70%)' }} />
      <div className="fixed bottom-[-300px] left-[-200px] w-[700px] h-[700px] rounded-full pointer-events-none z-0" style={{ background: 'radial-gradient(circle, rgba(255,185,0,0.04) 0%, transparent 70%)' }} />
      <div className="fixed inset-0 pointer-events-none z-[1]" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,136,0.015) 2px, rgba(0,255,136,0.015) 4px)' }} />

      <div className="relative z-10 w-full min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="rounded-3xl border border-white/10 shadow-2xl shadow-black/40 overflow-hidden bg-neutral-900/60 backdrop-blur-sm">
            <div className="flex flex-col lg:flex-row min-h-[520px]">
            <AuthBrandPanel>
              <div className="flex items-center gap-2 mb-4">
                <FileText size={16} />
                <span className="text-xs font-medium uppercase tracking-widest opacity-60">
                  Términos y Condiciones
                </span>
              </div>
              <h2 className="text-3xl font-bold leading-tight mb-4">
                Antes de
                <br />
                comenzar
              </h2>
              <p className="text-base leading-relaxed opacity-85 mb-5">
                TGP es una herramienta gratuita de gobierno tecnológico. Al usarla, aceptas los
                términos descritos al lado.
              </p>
              <ul className="space-y-3 text-base">
                {[
                  'Sin costo · Sin licencias',
                  '100% cliente-side',
                  'Tus datos, tu responsabilidad',
                  'Código abierto',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check size={16} className="mt-0.5 shrink-0 opacity-70" />
                    <span className="opacity-90">{item}</span>
                  </li>
                ))}
              </ul>
            </AuthBrandPanel>
            <PerforatedDivider />
            <div className="lg:w-[58%] p-8 lg:p-10 bg-gradient-to-b from-[#0e0e18] to-neutral-900 flex flex-col justify-center">
              <div className="max-w-lg mx-auto w-full space-y-5">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Términos de Uso
                  </h3>
                  <p className="text-sm text-neutral-400 mt-1">Leé atentamente antes de continuar</p>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10 max-h-[320px] overflow-y-auto text-sm text-neutral-300 leading-relaxed space-y-3">
                  <p>
                    <strong>1. Naturaleza del servicio.</strong> TGP es una herramienta de gobierno
                    tecnológico gratuita, sin garantías explícitas ni implícitas. Se proporciona
                    "tal cual" y bajo tu propio riesgo.
                  </p>

                  <p>
                    <strong>2. Almacenamiento de datos.</strong> Toda la información se almacena
                    localmente en el navegador del usuario mediante IndexedDB. No contamos con
                    servidores propios ni almacenamos datos en infraestructura controlada por
                    nosotros. Eres el único responsable de respaldar y proteger tu información.
                  </p>

                  <p>
                    <strong>3. Servicios en la nube (Azure).</strong> Si activas la funcionalidad de
                    backup o uso compartido mediante Azure Blob Storage, los datos viajarán y se
                    almacenarán en infraestructura de Microsoft Azure bajo tu propia configuración y
                    credenciales. No nos responsabilizamos por exposiciones, filtraciones o pérdidas
                    derivadas del uso de estos servicios externos.
                  </p>

                  <p>
                    <strong>4. Pérdida de datos.</strong> No garantizamos la integridad ni
                    disponibilidad de tus datos. Si actualizas el navegador, eliminas la aplicación,
                    limpias el almacenamiento local, o ocurre cualquier evento que afecte el entorno
                    del cliente, podrías perder toda la información registrada. Es tu
                    responsabilidad mantener copias de seguridad periódicas.
                  </p>

                  <p>
                    <strong>5. Actualizaciones.</strong> El sistema puede detectar nuevas versiones
                    y solicitar una recarga para aplicar cambios. No nos hacemos responsables por
                    inconsistencias o pérdidas durante el proceso de actualización.
                  </p>

                  <p>
                    <strong>6. Ausencia de garantía.</strong> TGP es una solución de código abierto,
                    sin soporte oficial ni garantía de funcionamiento en todos los entornos. El
                    equipo de desarrollo no asume responsabilidad por daños directos o indirectos
                    derivados del uso de la herramienta.
                  </p>

                  <p>
                    <strong>7. Privacidad y flujo de datos.</strong> No recolectamos, transmitimos
                    ni procesamos datos personales en infraestructura propia. Todo el uso queda bajo
                    tu control de la siguiente manera:
                  </p>
                  <ul className="pl-4 space-y-1 text-xs text-neutral-500 list-disc ml-1">
                    <li>
                      <strong>Almacenamiento local (IndexedDB):</strong> Todos los datos de la
                      aplicación se almacenan exclusivamente en tu navegador. No se envían a
                      servidores externos a menos que tú configures explícitamente un servicio de
                      backup, sharing o el asistente de IA.
                    </li>
                    <li>
                      <strong>Asistente GobIA:</strong> Si activas el asistente de IA (GobIA), los
                      mensajes que escribas y los resultados de las consultas se envían al proveedor
                      externo que hayas configurado (OpenAI, Groq, Anthropic u Ollama). Esta
                      funcionalidad es opcional y puedes deshabilitarla en cualquier momento desde
                      Configuración → IA.
                    </li>
                    <li>
                      <strong>Backup en Azure:</strong> Si configuras la funcionalidad de backup,
                      toda la base de datos se exporta y almacena en Azure Blob Storage bajo tu
                      propia SAS URL y container. Tú controlas cuándo y cómo se realiza el backup.
                    </li>
                    <li>
                      <strong>Sharing (enlaces públicos):</strong> Si compartes datos mediante
                      enlaces públicos, la información viaja cifrada (AES-GCM 256) a Azure Blob
                      Storage o se almacena localmente. La duración y visibilidad del enlace son
                      configurables.
                    </li>
                    <li>
                      <strong>Importación de datos:</strong> Los archivos Excel que importes se
                      procesan íntegramente en tu navegador. No se transmiten ni almacenan en
                      servidores externos.
                    </li>
                    <li>
                      <strong>Auditoría de datos:</strong> La herramienta <em>auditar_datos</em> se
                      ejecuta completamente en tu navegador recorriendo tu base de datos local. No
                      envía información a ningún servidor externo.
                    </li>
                  </ul>
                  <p className="text-xs text-neutral-500">
                    Eres responsable de revisar y gestionar estas configuraciones según las
                    políticas de tu institución.
                  </p>

                  <p>
                    <strong>8. Inteligencia Artificial (GobIA).</strong> TGP incluye un asistente
                    conversacional opcional (GobIA) que permite consultar los datos de la plataforma
                    en lenguaje natural mediante herramientas especializadas, incluyendo auditoría
                    de calidad de datos, consultas sobre aplicaciones, seguridad, equipos,
                    estrategia y más. Para funcionar, GobIA se conecta al proveedor de inteligencia
                    artificial que tú configures (OpenAI, Groq, Anthropic u Ollama). Esto implica
                    que los mensajes que escribas y los resultados de las consultas a tu base de
                    datos local serán enviados a dicho proveedor para su procesamiento. No
                    recolectamos datos para entrenamiento de modelos, no existe telemetría, ni
                    compartimos información con servidores de TGP. El uso de GobIA es completamente
                    opcional y puedes deshabilitarlo o cambiar de proveedor en cualquier momento
                    desde la configuración. Eres responsable de revisar las políticas de privacidad
                    del proveedor que elijas y de no compartir información sensible a través del
                    asistente. Este sistema fue desarrollado con asistencia de inteligencia
                    artificial generativa como herramienta de apoyo durante el desarrollo del
                    código; dicha asistencia no afecta la privacidad de tus datos.
                  </p>

                  <p>
                    <strong>9. Copyright y contenido del usuario.</strong> Eres el único responsable
                    del contenido que ingresas, importas o compartes en TGP. TGP no reclama
                    propiedad intelectual sobre los datos, textos, métricas o configuraciones que
                    registres en el sistema. Declaras y garantizas que cuentas con los derechos
                    necesarios sobre la información que ingresas, incluyendo pero no limitado a
                    datos institucionales, métricas de equipos, OKRs, hallazgos de auditoría y
                    cualquier otro contenido. TGP no será responsable por infracciones de derechos
                    de autor, propiedad intelectual o confidencialidad derivadas del contenido
                    ingresado por los usuarios.
                  </p>

                  {showFull && (
                    <>
                      <p>
                        <strong>10. Modificaciones.</strong> Nos reservamos el derecho de modificar
                        estos términos en cualquier momento. El uso continuado de la herramienta
                        después de los cambios constituye la aceptación de los nuevos términos.
                      </p>
                      <p>
                        <strong>11. Contacto.</strong> Para consultas, reportes o sugerencias,
                        puedes abrir un issue en el repositorio oficial del proyecto.
                      </p>
                    </>
                  )}
                  <button
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors underline underline-offset-2"
                    onClick={() => setShowFull(!showFull)}
                  >
                    {showFull ? 'Mostrar menos' : 'Leer términos completos'}
                  </button>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 text-cyan-400 focus:ring-cyan-400/30 accent-cyan-400"
                  />
                  <span className="text-sm text-neutral-300 leading-relaxed">
                    He leído y acepto los{' '}
                    <span className="text-cyan-400 font-medium">términos y condiciones</span> de TGP
                  </span>
                </label>

                <div className="flex items-center gap-3 pt-2">
                  <Button onClick={onDecline} variant="secondary" className="flex-1 rounded-xl border border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white">
                    <X size={18} />
                    No acepto
                  </Button>
                  <Button
                    onClick={onAccept}
                    disabled={!accepted}
                    className="flex-1 rounded-xl shadow-lg shadow-cyan-500/20 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-0"
                  >
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
  </div>
  )
}
