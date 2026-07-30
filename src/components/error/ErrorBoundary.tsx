import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

const R = 50
const CIRC = Math.PI * 100

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

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
            style={{
              background: 'radial-gradient(circle, rgba(0,255,136,0.06) 0%, transparent 70%)',
            }}
          />
          <div
            className="fixed bottom-[-300px] left-[-200px] w-[700px] h-[700px] rounded-full pointer-events-none z-0"
            style={{
              background: 'radial-gradient(circle, rgba(255,185,0,0.04) 0%, transparent 70%)',
            }}
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
              <div className="max-w-[600px] mx-auto text-center">
                {/* Status badge */}
                <div
                  className="inline-block font-mono text-[11px] font-medium uppercase tracking-wider mb-6 px-3.5 py-1.5"
                  style={{
                    color: '#ff4444',
                    border: '1px solid rgba(255,68,68,0.25)',
                    borderRadius: 2,
                    background: 'rgba(255,68,68,0.06)',
                  }}
                >
                  ✦ ERR-2026 — Runtime Exception
                </div>

                {/* Gauge */}
                <div className="relative w-[150px] h-[150px] mx-auto mb-6">
                  <svg
                    viewBox="0 0 120 120"
                    className="w-full h-full"
                    style={{ transform: 'rotate(-90deg)' }}
                  >
                    <defs>
                      <linearGradient id="eg" x1="0%" x2="100%">
                        <stop offset="0%" stopColor="#ff4444" />
                        <stop offset="100%" stopColor="#ff8b00" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="60"
                      cy="60"
                      r={R}
                      fill="none"
                      stroke="rgba(255,68,68,0.08)"
                      strokeWidth="10"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r={R}
                      fill="none"
                      stroke="url(#eg)"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${0.4 * CIRC} ${0.6 * CIRC}`}
                      strokeDashoffset={-0.1 * CIRC}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <div style={{ color: '#ff4444' }}>
                      <AlertTriangle size={28} />
                    </div>
                    <div
                      className="font-mono text-[10px] uppercase tracking-wider mt-1"
                      style={{ color: '#6b7a99' }}
                    >
                      Exception
                    </div>
                  </div>
                </div>

                <h1
                  className="font-mono text-[24px] font-extrabold leading-tight mb-3"
                  style={{ color: '#e8edf5' }}
                >
                  Algo salió mal
                </h1>

                <p className="text-sm leading-relaxed mb-6" style={{ color: '#6b7a99' }}>
                  Se produjo un error inesperado. Puedes intentar recargar la página o reintentar.
                </p>

                {/* Status table */}
                <div
                  className="w-full max-w-sm mx-auto font-mono text-[11px] text-left mb-6"
                  style={{ border: '1px solid rgba(255,68,68,0.1)', borderRadius: 4 }}
                >
                  <div
                    className="flex justify-between px-4 py-2.5"
                    style={{ borderBottom: '1px solid rgba(255,68,68,0.06)', color: '#6b7a99' }}
                  >
                    <span>Indicador</span>
                    <span>Estado</span>
                  </div>
                  <div
                    className="flex justify-between px-4 py-2.5"
                    style={{ borderBottom: '1px solid rgba(255,68,68,0.06)' }}
                  >
                    <span style={{ color: '#6b7a99' }}>Tipo</span>
                    <span style={{ color: '#ff4444' }}>{this.state.error?.name ?? 'Error'}</span>
                  </div>
                  <div
                    className="flex justify-between px-4 py-2.5"
                    style={{ borderBottom: '1px solid rgba(255,68,68,0.06)' }}
                  >
                    <span style={{ color: '#6b7a99' }}>Severidad</span>
                    <span style={{ color: '#ff4444' }}>Crítica (P0)</span>
                  </div>
                  <div className="flex justify-between px-4 py-2.5">
                    <span style={{ color: '#6b7a99' }}>Código</span>
                    <span style={{ color: '#ffb900' }}>500</span>
                  </div>
                </div>

                {/* Technical details — collapsible */}
                {this.state.error && (
                  <details className="mb-6 text-left max-w-sm mx-auto">
                    <summary
                      className="font-mono text-[11px] cursor-pointer"
                      style={{ color: '#6b7a99' }}
                    >
                      $ cat error.log # detalles técnicos
                    </summary>
                    <pre
                      className="mt-2 p-3 font-mono text-[11px] leading-relaxed overflow-auto max-h-24"
                      style={{
                        background: 'rgba(255,68,68,0.03)',
                        border: '1px solid rgba(255,68,68,0.08)',
                        borderRadius: 4,
                        color: '#8899bb',
                      }}
                    >
                      {this.state.error.message}
                    </pre>
                  </details>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
                  <button
                    onClick={this.handleReset}
                    className="font-mono text-[13px] font-bold uppercase tracking-wider cursor-pointer border-none transition-all"
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
                      <RefreshCw size={16} />
                      Reintentar
                    </span>
                  </button>
                  <button
                    onClick={this.handleReload}
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
                      <RefreshCw size={16} />
                      Recargar
                    </span>
                  </button>
                </div>

                {/* Terminal + report */}
                <div className="font-mono text-[11px]" style={{ color: 'rgba(0,255,136,0.3)' }}>
                  $ curl -s https://tgp.local/api/health | jq .
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
                  style={{ color: 'rgba(255,68,68,0.4)' }}
                >
                  → 500 — internal server error
                </div>

                <a
                  href="https://github.com/DiogenesPolanco/TGP/issues/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-mono text-[11px] mt-4 transition-colors"
                  style={{ color: '#6b7a99' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#c8d0e0'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#6b7a99'
                  }}
                >
                  <Bug size={12} />
                  Reportar error en GitHub
                </a>
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

    return this.props.children
  }
}
