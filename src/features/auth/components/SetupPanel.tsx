import { useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { ShieldCheck, Check, Copy, ArrowRight } from 'lucide-react'
import { OtpInput } from './loginComponents'

export function SetupPanel({
  secret,
  otp,
  error,
  verifying,
  copied,
  onOtpChange,
  onSubmit,
  onCopy,
}: {
  secret: { base32: string; uri: string }
  otp: string
  error: string
  verifying: boolean
  copied: boolean
  onOtpChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  onCopy: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const R = 50
  const CIRC = Math.PI * 100

  return (
    <div className="py-10 px-6 text-center">
      <div className="w-full max-w-[860px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start">
          {/* Left column — status overview */}
          <div className="text-center lg:text-left">
            <div
              className="inline-block lg:inline-flex font-mono text-[11px] font-medium uppercase tracking-wider mb-6 px-3.5 py-1.5"
              style={{
                color: '#00ff88',
                border: '1px solid rgba(0,255,136,0.25)',
                borderRadius: 2,
                background: 'rgba(0,255,136,0.06)',
              }}
            >
              ✦ OTP-2026 — Configuración de Acceso
            </div>

            <div className="relative w-[150px] h-[150px] mx-auto lg:mx-0 mb-6">
              <svg
                viewBox="0 0 120 120"
                className="w-full h-full"
                style={{ transform: 'rotate(-90deg)' }}
              >
                <defs>
                  <linearGradient id="sg" x1="0%" x2="100%">
                    <stop offset="0%" stopColor="#00ff88" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
                <circle
                  cx="60"
                  cy="60"
                  r={R}
                  fill="none"
                  stroke="rgba(0,255,136,0.08)"
                  strokeWidth="10"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={R}
                  fill="none"
                  stroke="url(#sg)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${0.5 * CIRC} ${0.5 * CIRC}`}
                  strokeDashoffset={-0.1 * CIRC}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <div
                  className="font-mono text-[24px] leading-none mb-1"
                  style={{ color: '#00ff88' }}
                >
                  <ShieldCheck size={28} />
                </div>
                <div
                  className="font-mono text-[10px] uppercase tracking-wider"
                  style={{ color: '#6b7a99' }}
                >
                  TOTP
                </div>
              </div>
            </div>

            <h1
              className="font-mono text-[24px] font-extrabold leading-tight mb-3"
              style={{ color: '#e8edf5' }}
            >
              Configura tu acceso
            </h1>

            <p className="text-sm leading-relaxed mb-6 max-w-[380px]" style={{ color: '#6b7a99' }}>
              Escanea el código QR con tu app de autenticación e ingresa el código de 6 dígitos para
              verificar.
            </p>

            <div
              className="w-full max-w-sm font-mono text-[11px] text-left"
              style={{ border: '1px solid rgba(0,255,136,0.1)', borderRadius: 4 }}
            >
              <div
                className="flex justify-between px-4 py-2.5"
                style={{ borderBottom: '1px solid rgba(0,255,136,0.06)', color: '#6b7a99' }}
              >
                <span>Indicador</span>
                <span>Estado</span>
              </div>
              <div
                className="flex justify-between px-4 py-2.5"
                style={{ borderBottom: '1px solid rgba(0,255,136,0.06)' }}
              >
                <span style={{ color: '#6b7a99' }}>Método</span>
                <span style={{ color: '#00ff88' }}>TOTP (SHA-1)</span>
              </div>
              <div
                className="flex justify-between px-4 py-2.5"
                style={{ borderBottom: '1px solid rgba(0,255,136,0.06)' }}
              >
                <span style={{ color: '#6b7a99' }}>Cifrado</span>
                <span style={{ color: '#00ff88' }}>AES-GCM 256</span>
              </div>
              <div
                className="flex justify-between px-4 py-2.5"
                style={{ borderBottom: '1px solid rgba(0,255,136,0.06)' }}
              >
                <span style={{ color: '#6b7a99' }}>App</span>
                <span style={{ color: '#22d3ee' }}>Google · Authy · MS</span>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <span style={{ color: '#6b7a99' }}>Estado</span>
                <span style={{ color: otp.length === 6 ? '#00ff88' : '#ffb900' }}>
                  {otp.length === 6 ? 'Listo' : 'Pendiente'}
                </span>
              </div>
            </div>
          </div>

          {/* Right column — QR, OTP & actions */}
          <div className="text-center lg:text-left">
            {/* QR code + secret */}
            <div className="mb-6">
              <div className="font-mono text-[11px] mb-2" style={{ color: 'rgba(0,255,136,0.3)' }}>
                $ echo $TOTP_SECRET
              </div>
              <div
                className="p-3"
                style={{
                  background: 'rgba(0,255,136,0.02)',
                  border: '1px solid rgba(0,255,136,0.08)',
                  borderRadius: 4,
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="shrink-0 p-2"
                    style={{
                      background: 'rgba(0,255,136,0.03)',
                      border: '1px solid rgba(0,255,136,0.08)',
                      borderRadius: 4,
                    }}
                  >
                    <QRCodeSVG value={secret.uri} size={130} level="M" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-mono mb-1.5" style={{ color: '#6b7a99' }}>
                      Código secreto
                    </p>
                    <div className="flex items-center gap-1.5">
                      <code
                        className="flex-1 text-[10px] leading-relaxed break-all select-all font-mono p-2"
                        style={{
                          color: '#8899bb',
                          background: 'rgba(0,255,136,0.02)',
                          border: '1px solid rgba(0,255,136,0.06)',
                          borderRadius: 2,
                        }}
                      >
                        {secret.base32}
                      </code>
                      <button
                        onClick={onCopy}
                        className="shrink-0 p-1.5 cursor-pointer transition-colors"
                        style={{ borderRadius: 2 }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(0,255,136,0.06)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                        }}
                        title="Copiar secreto"
                      >
                        {copied ? (
                          <Check size={14} className="text-emerald-400" />
                        ) : (
                          <Copy size={14} style={{ color: '#6b7a99' }} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* OTP form */}
            <form onSubmit={onSubmit} className="mb-8">
              <div
                className="font-mono text-[11px] mb-2 text-left"
                style={{ color: 'rgba(0,255,136,0.3)' }}
              >
                $ otp —verify 6 dígitos
              </div>
              <OtpInput
                inputRef={inputRef}
                value={otp}
                onChange={onOtpChange}
                className="text-3xl py-4"
              />

              {error && (
                <p className="text-sm font-mono text-left mt-2" style={{ color: '#ff4444' }}>
                  ✗ {error}
                </p>
              )}

              <button
                type="submit"
                disabled={otp.length !== 6 || verifying}
                className="w-full font-mono text-[13px] font-bold uppercase tracking-wider cursor-pointer border-none transition-all disabled:opacity-30 disabled:cursor-not-allowed mt-4"
                style={{
                  background: '#00ff88',
                  color: '#080c14',
                  padding: '14px 28px',
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
                <span className="flex items-center justify-center gap-2">
                  {verifying ? 'Verificando…' : 'Verificar y despegar'}
                  {!verifying && <ArrowRight size={18} />}
                </span>
              </button>
            </form>

            {/* Terminal */}
            <div
              className="font-mono text-[11px] text-left"
              style={{ color: 'rgba(0,255,136,0.3)' }}
            >
              $ curl -s https://tgp.local/api/setup/verify | jq .
              <span
                className="inline-block w-[7px] h-[14px] align-middle ml-1"
                style={{
                  background: 'rgba(0,255,136,0.5)',
                  animation: 'tgp-blink 1s step-end infinite',
                }}
              />
            </div>
            <div
              className="font-mono text-[11px] mt-1 text-left"
              style={{
                color: otp.length === 6 ? 'rgba(0,255,136,0.4)' : 'rgba(107,122,153,0.3)',
              }}
            >
              {otp.length === 6
                ? '→ 200 — OTP ready (listo para verificar)'
                : '→ 412 — incomplete (ingresa 6 dígitos)'}
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes tgp-blink { 50% { opacity: 0 } }`}</style>
    </div>
  )
}
