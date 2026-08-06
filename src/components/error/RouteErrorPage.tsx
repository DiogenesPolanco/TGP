import { isRouteErrorResponse, useRouteError } from 'react-router'
import { RefreshCw, Bug } from 'lucide-react'

export function RouteErrorPage() {
  const error = useRouteError()

  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Error inesperado'

  const isChunkError =
    message.includes('dynamically imported') ||
    message.includes('import()') ||
    message.includes('chunk') ||
    message.includes('loading chunk')

  const statusCode = isRouteErrorResponse(error) ? error.status : isChunkError ? 424 : 500
  const statusColor = statusCode >= 500 ? '#ff4444' : statusCode >= 400 ? '#ffb900' : '#00ff88'

  const R = 50
  const CIRC = Math.PI * 100

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
          <div className="max-w-[600px] mx-auto text-center">
            {/* Status badge */}
            <div
              className="inline-block font-mono text-[11px] font-medium uppercase tracking-wider mb-6 px-3.5 py-1.5"
              style={{
                color: statusColor,
                border: `1px solid ${statusColor}40`,
                borderRadius: 2,
                background: `${statusColor}10`,
              }}
            >
              ✦ {isChunkError ? 'CHUNK-2026' : 'ROUTE-2026'} —{' '}
              {isChunkError ? 'Actualización disponible' : 'Error de ruta'}
            </div>

            {/* Gauge */}
            <div className="relative w-[150px] h-[150px] mx-auto mb-6">
              <svg
                viewBox="0 0 120 120"
                className="w-full h-full"
                style={{ transform: 'rotate(-90deg)' }}
              >
                <defs>
                  <linearGradient id="rg" x1="0%" x2="100%">
                    <stop offset="0%" stopColor={statusCode >= 500 ? '#ff4444' : '#ffb900'} />
                    <stop offset="100%" stopColor={statusCode >= 400 ? '#ff8b00' : '#00ff88'} />
                  </linearGradient>
                </defs>
                <circle
                  cx="60"
                  cy="60"
                  r={R}
                  fill="none"
                  stroke={`${statusColor}15`}
                  strokeWidth="10"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={R}
                  fill="none"
                  stroke="url(#rg)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${0.5 * CIRC} ${0.5 * CIRC}`}
                  strokeDashoffset={-0.1 * CIRC}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <div
                  className="font-mono text-[32px] font-extrabold leading-none"
                  style={{ color: statusColor }}
                >
                  {statusCode}
                </div>
                <div
                  className="font-mono text-[10px] uppercase tracking-wider mt-1"
                  style={{ color: '#6b7a99' }}
                >
                  Status
                </div>
              </div>
            </div>

            <h1
              className="font-mono text-[24px] font-extrabold leading-tight mb-3"
              style={{ color: '#e8edf5' }}
            >
              {isChunkError ? 'Actualización disponible' : 'Algo salió mal'}
            </h1>

            <p className="text-sm leading-relaxed mb-6" style={{ color: '#6b7a99' }}>
              {isChunkError
                ? 'La aplicación se actualizó recientemente. Recarga para obtener la última versión.'
                : 'Ocurrió un error inesperado al cargar esta sección.'}
            </p>

            {/* Status table */}
            <div
              className="w-full max-w-sm mx-auto font-mono text-[11px] text-left mb-6"
              style={{ border: `1px solid ${statusColor}15`, borderRadius: 4 }}
            >
              <div
                className="flex justify-between px-4 py-2.5"
                style={{ borderBottom: `1px solid ${statusColor}10`, color: '#6b7a99' }}
              >
                <span>Indicador</span>
                <span>Valor</span>
              </div>
              <div
                className="flex justify-between px-4 py-2.5"
                style={{ borderBottom: `1px solid ${statusColor}10` }}
              >
                <span style={{ color: '#6b7a99' }}>Código</span>
                <span style={{ color: statusColor }}>{statusCode}</span>
              </div>
              <div
                className="flex justify-between px-4 py-2.5"
                style={{ borderBottom: `1px solid ${statusColor}10` }}
              >
                <span style={{ color: '#6b7a99' }}>Tipo</span>
                <span style={{ color: statusColor }}>
                  {isChunkError ? 'ChunkError' : 'RouteError'}
                </span>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <span style={{ color: '#6b7a99' }}>Severidad</span>
                <span style={{ color: statusCode >= 500 ? '#ff4444' : '#ffb900' }}>
                  {statusCode >= 500
                    ? 'Crítica (P0)'
                    : statusCode >= 400
                      ? 'Media (P2)'
                      : 'Baja (P4)'}
                </span>
              </div>
            </div>

            {/* Technical details — collapsible */}
            {!isChunkError && (
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
                  {message}
                </pre>
              </details>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <button
                onClick={() => window.location.reload()}
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
                  {isChunkError ? 'Recargar ahora' : 'Recargar página'}
                </span>
              </button>
              <a
                href="https://github.com/DiogenesPolanco/TGP/issues/new"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[13px] font-semibold uppercase tracking-wider cursor-pointer transition-all inline-flex items-center justify-center"
                style={{
                  background: 'transparent',
                  color: '#6b7a99',
                  border: '1px solid rgba(107,122,153,0.3)',
                  padding: '12px 28px',
                  borderRadius: 4,
                  textDecoration: 'none',
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
                  <Bug size={16} />
                  Reportar
                </span>
              </a>
            </div>

            {/* Terminal */}
            <div className="font-mono text-[11px]" style={{ color: 'rgba(0,255,136,0.3)' }}>
              $ curl -s https://tgp.local/api/route/status | jq .
              <span
                className="inline-block w-[7px] h-[14px] align-middle ml-1"
                style={{
                  background: 'rgba(0,255,136,0.5)',
                  animation: 'tgp-blink 1s step-end infinite',
                }}
              />
            </div>
            <div className="font-mono text-[11px] mt-1" style={{ color: `${statusColor}80` }}>
              → {statusCode} —{' '}
              {isChunkError
                ? 'chunk load failed'
                : isRouteErrorResponse(error)
                  ? error.statusText.toLowerCase()
                  : 'internal error'}
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
