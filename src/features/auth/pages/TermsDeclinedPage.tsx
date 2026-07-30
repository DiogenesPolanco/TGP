import { ArrowLeft, RefreshCw } from 'lucide-react'

export function TermsDeclinedPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen font-sans overflow-x-hidden relative flex items-center justify-center" style={{ background: '#080c14', color: '#c8d0e0' }}>
      {/* Background grid + glows */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{ backgroundImage: 'linear-gradient(rgba(0,255,136,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.04) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      <div className="fixed top-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full pointer-events-none z-0" style={{ background: 'radial-gradient(circle, rgba(0,255,136,0.06) 0%, transparent 70%)' }} />
      <div className="fixed bottom-[-300px] left-[-200px] w-[700px] h-[700px] rounded-full pointer-events-none z-0" style={{ background: 'radial-gradient(circle, rgba(255,185,0,0.04) 0%, transparent 70%)' }} />
      <div className="fixed inset-0 pointer-events-none z-[1]" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,136,0.015) 2px, rgba(0,255,136,0.015) 4px)' }} />

      <div className="relative z-10 max-w-[800px] mx-auto px-6 text-center">
        {/* Status badge */}
        <div className="inline-block font-mono text-[11px] font-medium uppercase tracking-wider mb-6 px-3.5 py-1.5" style={{ color: '#ffb900', border: '1px solid rgba(255,185,0,0.25)', borderRadius: 2, background: 'rgba(255,185,0,0.06)' }}>
          ✦ EXCEL-2026 — Modo Legacy Activado
        </div>

        {/* Gauge — spreadsheet spin */}
        <div className="relative w-[180px] h-[180px] mx-auto mb-8">
          <svg viewBox="0 0 120 120" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
            <defs>
              <linearGradient id="eg" x1="0%" x2="100%">
                <stop offset="0%" stopColor="#ffb900" />
                <stop offset="50%" stopColor="#ff8b00" />
                <stop offset="100%" stopColor="#ff5630" />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r={50} fill="none" stroke="rgba(255,185,0,0.08)" strokeWidth="10" />
            <circle cx="60" cy="60" r={50} fill="none" stroke="url(#eg)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${0.72 * Math.PI * 100} ${0.28 * Math.PI * 100}`} strokeDashoffset={-0.05 * Math.PI * 100} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <div className="font-mono text-[48px] leading-none mb-1" style={{ color: '#ffb900' }}>📊</div>
            <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: '#6b7a99' }}>THI Score</div>
          </div>
        </div>

        <h1 className="font-mono text-[28px] font-extrabold leading-tight mb-4" style={{ color: '#e8edf5' }}>
          ¡Nos vemos<br />
          en Excel!
        </h1>

        <p className="text-sm leading-relaxed mb-8 max-w-[600px] mx-auto" style={{ color: '#6b7a99' }}>
          Entendemos que TGP no es para todos.
          <br />
          Suerte con esas hojas de cálculo.
        </p>

        {/* Status table */}
        <div className="max-w-[480px] mx-auto mb-10 font-mono text-[11px] text-left" style={{ border: '1px solid rgba(255,185,0,0.1)', borderRadius: 4 }}>
          <div className="flex justify-between px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,185,0,0.06)', color: '#6b7a99' }}>
            <span>Indicador</span>
            <span>Estado</span>
          </div>
          <div className="flex justify-between px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,185,0,0.06)' }}>
            <span style={{ color: '#6b7a99' }}>THI Score</span>
            <span style={{ color: '#00ff88' }}>—</span>
          </div>
          <div className="flex justify-between px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,185,0,0.06)' }}>
            <span style={{ color: '#6b7a99' }}>Automatización</span>
            <span style={{ color: '#ffb900' }}>0%</span>
          </div>
          <div className="flex justify-between px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,185,0,0.06)' }}>
            <span style={{ color: '#6b7a99' }}>Modo</span>
            <span style={{ color: '#ffb900' }}>Manual</span>
          </div>
          <div className="flex justify-between px-4 py-2.5">
            <span style={{ color: '#6b7a99' }}>Obsolescencia</span>
            <span style={{ color: '#ffb900' }}>{new Date().toISOString().slice(0, 10)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onBack}
            className="font-mono text-[13px] font-bold uppercase tracking-wider cursor-pointer border-none transition-all"
            style={{ background: '#00ff88', color: '#080c14', padding: '12px 28px', borderRadius: 4 }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 30px rgba(0,255,136,0.3)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}
          >
            <span className="flex items-center gap-2">
              <ArrowLeft size={16} />
              Volver
            </span>
          </button>
          <button
            onClick={() => window.location.reload()}
            className="font-mono text-[13px] font-semibold uppercase tracking-wider cursor-pointer transition-all"
            style={{ background: 'transparent', color: '#6b7a99', border: '1px solid rgba(107,122,153,0.3)', padding: '12px 28px', borderRadius: 4 }}
            onMouseEnter={e => { e.currentTarget.style.color = '#c8d0e0'; e.currentTarget.style.borderColor = '#6b7a99' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#6b7a99'; e.currentTarget.style.borderColor = 'rgba(107,122,153,0.3)' }}
          >
            <span className="flex items-center gap-2">
              <RefreshCw size={16} />
              Reintentar
            </span>
          </button>
        </div>

        {/* Terminal */}
        <div className="font-mono text-[11px] mt-10" style={{ color: 'rgba(0,255,136,0.3)' }}>
          $ curl -s https://tgp.local/api/governance/acceptance | jq .
          <span className="inline-block w-[7px] h-[14px] align-middle ml-1" style={{ background: 'rgba(0,255,136,0.5)', animation: 'tgp-blink 1s step-end infinite' }} />
        </div>
        <div className="font-mono text-[11px] mt-1" style={{ color: 'rgba(255,185,0,0.4)' }}>
          → 418 — I&apos;m a teapot (prefiero Excel) ☕
        </div>
        <div className="font-mono text-[11px] mt-1" style={{ color: 'rgba(107,122,153,0.3)' }}>
          # Nos vemos cuando maduren
        </div>
      </div>

      <style>{`@keyframes tgp-blink { 50% { opacity: 0 } }`}</style>
    </div>
  )
}
