const R = 50
const CIRCUMFERENCE = 2 * Math.PI * R

export function UpdateAvailable({
  onReload,
  onDismiss,
  currentBuild,
}: {
  onReload: () => void
  onDismiss?: () => void
  currentBuild?: string | null
}) {
  return (
    <div
      className="min-h-screen font-sans overflow-x-hidden relative flex items-center justify-center"
      style={{ background: '#080c14', color: '#c8d0e0' }}
    >
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
        style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)' }}
      />
      <div
        className="fixed bottom-[-300px] left-[-200px] w-[700px] h-[700px] rounded-full pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(0,255,136,0.04) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 w-full max-w-5xl px-4 py-8">
        <div className="rounded-3xl border border-white/10 shadow-2xl shadow-black/40 overflow-hidden bg-neutral-900/60 backdrop-blur-sm p-8 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
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
                ✦ RELEASE-2026 — Nueva Versión Detectada
              </div>

              <div className="relative w-[180px] h-[180px] mx-auto lg:mx-0 mb-8">
                <svg
                  viewBox="0 0 120 120"
                  className="w-full h-full"
                  style={{ transform: 'rotate(-90deg)' }}
                >
                  <defs>
                    <linearGradient id="ug" x1="0%" x2="100%">
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
                    stroke="url(#ug)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${0.75 * CIRCUMFERENCE} ${0.25 * CIRCUMFERENCE}`}
                    strokeDashoffset={-0.05 * CIRCUMFERENCE}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <div
                    className="font-mono text-[48px] font-extrabold leading-none"
                    style={{ color: '#22d3ee' }}
                  >
                    NEW
                  </div>
                  <div
                    className="font-mono text-[10px] uppercase tracking-wider mt-1"
                    style={{ color: '#6b7a99' }}
                  >
                    Update Check
                  </div>
                </div>
              </div>

              <h1
                className="font-mono text-[28px] font-extrabold leading-tight mb-4"
                style={{ color: '#e8edf5' }}
              >
                Nueva versión
                <br />
                disponible
              </h1>

              <p className="text-sm leading-relaxed max-w-[480px]" style={{ color: '#6b7a99' }}>
                Se ha detectado una versión más reciente de TGP. Recarga la aplicación para aplicar
                las últimas mejoras y correcciones.
              </p>
            </div>

            <div className="text-center lg:text-left">
              <div
                className="w-full font-mono text-[11px] text-left mb-8"
                style={{ border: '1px solid rgba(34,211,238,0.1)', borderRadius: 4 }}
              >
                <div
                  className="flex justify-between px-4 py-2.5"
                  style={{ borderBottom: '1px solid rgba(34,211,238,0.06)', color: '#6b7a99' }}
                >
                  <span>Indicador</span>
                  <span>Estado</span>
                </div>
                <div
                  className="flex justify-between px-4 py-2.5"
                  style={{ borderBottom: '1px solid rgba(34,211,238,0.06)' }}
                >
                  <span style={{ color: '#6b7a99' }}>Versión</span>
                  <span style={{ color: '#22d3ee' }}>Nueva</span>
                </div>
                <div
                  className="flex justify-between px-4 py-2.5"
                  style={{ borderBottom: '1px solid rgba(34,211,238,0.06)' }}
                >
                  <span style={{ color: '#6b7a99' }}>Build</span>
                  <span style={{ color: currentBuild ? '#ffb900' : '#22d3ee' }}>
                    {currentBuild ?? 'Disponible'}
                  </span>
                </div>
                <div
                  className="flex justify-between px-4 py-2.5"
                  style={{ borderBottom: '1px solid rgba(34,211,238,0.06)' }}
                >
                  <span style={{ color: '#6b7a99' }}>Datos</span>
                  <span style={{ color: '#00ff88' }}>Seguros</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span style={{ color: '#6b7a99' }}>Estado</span>
                  <span style={{ color: '#22d3ee' }}>Pendiente</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <button
                  onClick={onReload}
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
                  ⟳ Recargar ahora
                </button>
                {onDismiss && (
                  <button
                    onClick={onDismiss}
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
                    Continuar sin actualizar
                  </button>
                )}
              </div>

              <div className="font-mono text-[11px]" style={{ color: 'rgba(0,255,136,0.3)' }}>
                $ curl -s https://tgp.local/version.json | jq .build
                <span
                  className="inline-block w-[7px] h-[14px] align-middle ml-1"
                  style={{
                    background: 'rgba(0,255,136,0.5)',
                    animation: 'tgp-blink 1s step-end infinite',
                  }}
                />
              </div>
              <div className="font-mono text-[11px] mt-1" style={{ color: 'rgba(34,211,238,0.4)' }}>
                → 200 — update available (recarga para aplicar)
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
