import type { ReactNode } from 'react'

export function AuthBrandPanel({ children }: { children: ReactNode }) {
  return (
    <div className="lg:w-[42%] bg-gradient-to-b from-neutral-900 to-[#0a0a12] p-8 lg:p-10 text-white flex flex-col relative overflow-hidden">
      {/* Grid verde estilo landing */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[60%]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,255,136,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.04) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
      {/* Glows verde/dorado */}
      <div
        className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,255,136,0.10) 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,185,0,0.06) 0%, transparent 70%)' }}
      />
      <div className="relative flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/20 flex items-center justify-center backdrop-blur-sm">
          <img src="/favicon.svg" alt="TGP" className="w-full h-full" />
        </div>
        <div>
          <p className="text-xl font-bold tracking-tight text-white">TGP</p>
          <p className="text-[11px] font-medium text-cyan-300/60 tracking-wide">
            Technology Governance Platform
          </p>
        </div>
      </div>
      <div className="relative flex-1 flex flex-col justify-center">{children}</div>
      <div className="relative mt-6 pt-4 border-t border-white/10">
        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          LOCAL-FIRST
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse [animation-delay:300ms]" />
          OFFLINE-READY
        </div>
      </div>
    </div>
  )
}

export function PerforatedDivider() {
  return (
    <div className="hidden lg:block w-5 bg-neutral-900/95 relative">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="w-2.5 h-2.5 rounded-full bg-neutral-800 border border-white/5" />
        ))}
      </div>
    </div>
  )
}

export function OtpInput({
  inputRef,
  value,
  onChange,
  className = '',
}: {
  inputRef?: React.RefObject<HTMLInputElement | null>
  value: string
  onChange: (val: string) => void
  className?: string
}) {
  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      value={value}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 6)
        onChange(digits)
      }}
      placeholder="000000"
      className={`w-full text-center tracking-[0.5em] font-mono px-4 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-neutral-600 focus:outline-none focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/20 transition-all ${className}`}
      maxLength={6}
    />
  )
}
