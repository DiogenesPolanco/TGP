import { useState } from 'react'
import { Check, X, FileText } from 'lucide-react'

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

const R = 50
const CIRC = Math.PI * 100

export function TermsPage({ onAccept, onDecline }: Props) {
  const [accepted, setAccepted] = useState(false)
  const [showFull, setShowFull] = useState(false)

  return (
    <div
      className="min-h-screen font-sans overflow-x-hidden relative flex items-center justify-center"
      style={{ background: '#080c14', color: '#c8d0e0' }}
    >
      {/* Background grid + glows */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,255,136,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      <div
        className="fixed top-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(0,255,136,0.06) 0%, transparent 70%)' }}
      />
      <div
        className="fixed bottom-[-300px] left-[-200px] w-[700px] h-[700px] rounded-full pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(255,185,0,0.04) 0%, transparent 70%)' }}
      />
      <div
        className="fixed inset-0 pointer-events-none z-[1]"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,136,0.015) 2px, rgba(0,255,136,0.015) 4px)',
        }}
      />

      <div className="relative z-10 w-full max-w-5xl px-4 py-8">
        <div className="rounded-3xl border border-white/10 shadow-2xl shadow-black/40 overflow-hidden bg-neutral-900/60 backdrop-blur-sm p-8 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Left column — status overview */}
            <div className="text-center lg:text-left">
              <div
                className="inline-block lg:inline-flex font-mono text-[11px] font-medium uppercase tracking-wider mb-6 px-3.5 py-1.5"
                style={{
                  color: '#22d3ee',
                  border: '1px solid rgba(34,211,238,0.25)',
                  borderRadius: 2,
                  background: 'rgba(34,211,238,0.06)',
                }}
              >
                ✦ TERMS-2026 — Acuerdo de Gobierno Tecnológico
              </div>

              <div className="relative w-[180px] h-[180px] mx-auto lg:mx-0 mb-8">
                <svg
                  viewBox="0 0 120 120"
                  className="w-full h-full"
                  style={{ transform: 'rotate(-90deg)' }}
                >
                  <defs>
                    <linearGradient id="tg" x1="0%" x2="100%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="60"
                    cy="60"
                    r={R}
                    fill="none"
                    stroke="rgba(34,211,238,0.08)"
                    strokeWidth="10"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r={R}
                    fill="none"
                    stroke="url(#tg)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${0.6 * CIRC} ${0.4 * CIRC}`}
                    strokeDashoffset={-0.1 * CIRC}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <div
                    className="font-mono text-[28px] font-extrabold leading-none"
                    style={{ color: '#22d3ee' }}
                  >
                    <FileText size={32} />
                  </div>
                  <div
                    className="font-mono text-[10px] uppercase tracking-wider mt-1"
                    style={{ color: '#6b7a99' }}
                  >
                    v{TERMS_VERSION}.0
                  </div>
                </div>
              </div>

              <p
                className="text-sm leading-relaxed mb-8 max-w-[420px]"
                style={{ color: '#6b7a99' }}
              >
                TGP es una herramienta gratuita de gobierno tecnológico. Al usarla, aceptas los
                términos descritos a la derecha.
              </p>

              <div
                className="w-full max-w-sm font-mono text-[11px] text-left"
                style={{ border: '1px solid rgba(34,211,238,0.1)', borderRadius: 4 }}
              >
                <div
                  className="flex justify-between px-4 py-2.5"
                  style={{ borderBottom: '1px solid rgba(34,211,238,0.06)', color: '#6b7a99' }}
                >
                  <span>Indicador</span>
                  <span>Valor</span>
                </div>
                <div
                  className="flex justify-between px-4 py-2.5"
                  style={{ borderBottom: '1px solid rgba(34,211,238,0.06)' }}
                >
                  <span style={{ color: '#6b7a99' }}>Versión</span>
                  <span style={{ color: '#22d3ee' }}>{TERMS_VERSION}.0</span>
                </div>
                <div
                  className="flex justify-between px-4 py-2.5"
                  style={{ borderBottom: '1px solid rgba(34,211,238,0.06)' }}
                >
                  <span style={{ color: '#6b7a99' }}>Artículos</span>
                  <span style={{ color: '#22d3ee' }}>{showFull ? '11' : '9'}</span>
                </div>
                <div
                  className="flex justify-between px-4 py-2.5"
                  style={{ borderBottom: '1px solid rgba(34,211,238,0.06)' }}
                >
                  <span style={{ color: '#6b7a99' }}>Estado</span>
                  <span style={{ color: '#00ff88' }}>Pendiente</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span style={{ color: '#6b7a99' }}>Vigencia</span>
                  <span style={{ color: '#ffb900' }}>{new Date().toISOString().slice(0, 10)}</span>
                </div>
              </div>
            </div>

            {/* Right column — terms & actions */}
            <div className="text-center lg:text-left">
              <h1
                className="font-mono text-[28px] font-extrabold leading-tight mb-4"
                style={{ color: '#e8edf5' }}
              >
                Términos y Condiciones
              </h1>

              <div className="mb-6">
                <div
                  className="font-mono text-[11px] mb-2"
                  style={{ color: 'rgba(0,255,136,0.3)' }}
                >
                  $ cat terms-of-service.md
                </div>
                <div
                  className="max-h-[320px] overflow-y-auto font-mono text-[12px] leading-relaxed p-4"
                  style={{
                    background: 'rgba(0,255,136,0.02)',
                    border: '1px solid rgba(34,211,238,0.08)',
                    borderRadius: 4,
                    color: '#8899bb',
                  }}
                >
                  <p className="mb-3">
                    <span style={{ color: '#22d3ee' }}>1.</span>{' '}
                    <strong style={{ color: '#c8d0e0' }}>Naturaleza del servicio.</strong> TGP es
                    una herramienta de gobierno tecnológico gratuita, sin garantías explícitas ni
                    implícitas. Se proporciona &ldquo;tal cual&rdquo; y bajo tu propio riesgo.
                  </p>

                  <p className="mb-3">
                    <span style={{ color: '#22d3ee' }}>2.</span>{' '}
                    <strong style={{ color: '#c8d0e0' }}>Almacenamiento de datos.</strong> Toda la
                    información se almacena localmente en el navegador mediante IndexedDB. No
                    contamos con servidores propios. Eres el único responsable de respaldar tu
                    información.
                  </p>

                  <p className="mb-3">
                    <span style={{ color: '#22d3ee' }}>3.</span>{' '}
                    <strong style={{ color: '#c8d0e0' }}>Servicios en la nube (Azure).</strong> Si
                    activas backup o uso compartido mediante Azure Blob Storage, los datos viajarán
                    a infraestructura de Microsoft Azure bajo tu propia configuración y
                    credenciales.
                  </p>

                  <p className="mb-3">
                    <span style={{ color: '#22d3ee' }}>4.</span>{' '}
                    <strong style={{ color: '#c8d0e0' }}>Pérdida de datos.</strong> No garantizamos
                    la integridad ni disponibilidad de tus datos. Es tu responsabilidad mantener
                    copias de seguridad periódicas.
                  </p>

                  <p className="mb-3">
                    <span style={{ color: '#22d3ee' }}>5.</span>{' '}
                    <strong style={{ color: '#c8d0e0' }}>Actualizaciones.</strong> El sistema puede
                    detectar nuevas versiones y solicitar una recarga para aplicar cambios.
                  </p>

                  <p className="mb-3">
                    <span style={{ color: '#22d3ee' }}>6.</span>{' '}
                    <strong style={{ color: '#c8d0e0' }}>Ausencia de garantía.</strong> TGP es una
                    solución de código abierto, sin soporte oficial ni garantía de funcionamiento en
                    todos los entornos.
                  </p>

                  <p className="mb-3">
                    <span style={{ color: '#22d3ee' }}>7.</span>{' '}
                    <strong style={{ color: '#c8d0e0' }}>Privacidad y flujo de datos.</strong> No
                    recolectamos, transmitimos ni procesamos datos personales en infraestructura
                    propia.
                  </p>

                  <p className="mb-3">
                    <span style={{ color: '#22d3ee' }}>8.</span>{' '}
                    <strong style={{ color: '#c8d0e0' }}>Inteligencia Artificial (GobIA).</strong>{' '}
                    TGP incluye un asistente conversacional opcional. Para funcionar, GobIA se
                    conecta al proveedor de IA que tú configures.
                  </p>

                  <p className="mb-3">
                    <span style={{ color: '#22d3ee' }}>9.</span>{' '}
                    <strong style={{ color: '#c8d0e0' }}>Copyright y contenido del usuario.</strong>{' '}
                    Eres el único responsable del contenido que ingresas, importas o compartes en
                    TGP.
                  </p>

                  {showFull && (
                    <>
                      <p className="mb-3">
                        <span style={{ color: '#22d3ee' }}>10.</span>{' '}
                        <strong style={{ color: '#c8d0e0' }}>Modificaciones.</strong> Nos reservamos
                        el derecho de modificar estos términos en cualquier momento.
                      </p>
                      <p className="mb-3">
                        <span style={{ color: '#22d3ee' }}>11.</span>{' '}
                        <strong style={{ color: '#c8d0e0' }}>Contacto.</strong> Para consultas,
                        reportes o sugerencias, abre un issue en el repositorio oficial.
                      </p>
                    </>
                  )}

                  <button
                    className="text-[11px] mt-1 underline underline-offset-2 cursor-pointer"
                    style={{ color: 'rgba(34,211,238,0.6)' }}
                    onClick={() => setShowFull(!showFull)}
                  >
                    {showFull ? 'Mostrar menos' : 'Leer términos completos (10-11)'}
                  </button>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer mb-6 max-w-md">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 accent-cyan-400"
                />
                <span className="text-sm font-mono" style={{ color: '#8899bb' }}>
                  He leído y acepto los{' '}
                  <span style={{ color: '#22d3ee' }}>términos y condiciones</span> de TGP
                </span>
              </label>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <button
                  onClick={onDecline}
                  className="font-mono text-[13px] font-semibold uppercase tracking-wider cursor-pointer transition-all"
                  style={{
                    background: 'transparent',
                    color: '#6b7a99',
                    border: '1px solid rgba(107,122,153,0.3)',
                    padding: '12px 28px',
                    borderRadius: 4,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#c8d0e0'
                    e.currentTarget.style.borderColor = '#6b7a99'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#6b7a99'
                    e.currentTarget.style.borderColor = 'rgba(107,122,153,0.3)'
                  }}
                >
                  <span className="flex items-center gap-2">
                    <X size={16} />
                    No acepto
                  </span>
                </button>
                <button
                  onClick={onAccept}
                  disabled={!accepted}
                  className="font-mono text-[13px] font-bold uppercase tracking-wider cursor-pointer border-none transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    background: '#00ff88',
                    color: '#080c14',
                    padding: '12px 28px',
                    borderRadius: 4,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 30px rgba(0,255,136,0.3)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.transform = 'none'
                  }}
                >
                  <span className="flex items-center gap-2">
                    <Check size={16} />
                    Aceptar y continuar
                  </span>
                </button>
              </div>

              <div className="font-mono text-[11px]" style={{ color: 'rgba(0,255,136,0.3)' }}>
                $ curl -s https://tgp.local/api/terms/accept | jq .
                <span
                  className="inline-block w-[7px] h-[14px] align-middle ml-1"
                  style={{
                    background: 'rgba(0,255,136,0.5)',
                    animation: 'tgp-blink 1s step-end infinite',
                  }}
                />
              </div>
              <div
                className="font-mono text-[11px] mt-1"
                style={{
                  color: accepted ? 'rgba(0,255,136,0.4)' : 'rgba(107,122,153,0.3)',
                }}
              >
                {accepted
                  ? '→ 200 — accepted (gracias por leer)'
                  : '→ 412 — precondition required (marca el checkbox)'}
              </div>
            </div>
          </div>
        </div>
        <p className="text-center text-xs text-neutral-500 mt-6 font-medium font-mono">
          LOCAL-FIRST · SIN CONEXIÓN EXTERNA
        </p>
      </div>

      <style>{`@keyframes tgp-blink { 50% { opacity: 0 } }`}</style>
    </div>
  )
}
