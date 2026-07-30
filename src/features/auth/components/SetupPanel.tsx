import { useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { ShieldCheck, Check, Copy, ArrowRight } from 'lucide-react'
import { AuthBrandPanel, PerforatedDivider, OtpInput } from './loginComponents'
import { Button } from '@/components/ui/Button'

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

  return (
    <div className="flex flex-col lg:flex-row min-h-[520px]">
      <AuthBrandPanel>
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck size={16} />
          <span className="text-xs font-medium uppercase tracking-widest opacity-60">
            Setup · Primer acceso
          </span>
        </div>
        <h2 className="text-3xl font-bold leading-tight mb-4">
          Tu gobierno
          <br />
          tecnológico
          <br />
          empieza aquí
        </h2>
        <p className="text-base leading-relaxed opacity-85 mb-5">
          TGP unifica cada dimensión de tu portafolio en un solo tablero de comando.
        </p>
        <ul className="space-y-3 text-base">
          {[
            'THI en tiempo real con 7 dimensiones de salud',
            'Alertas automáticas de riesgos y vencimientos',
            'Métricas DORA y OKRs vinculados a ejecución',
            'Obsolescencia sincronizada con endoflife.date',
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
        <div className="max-w-lg mx-auto w-full space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white">
              Configura tu acceso
            </h3>
            <p className="text-base text-neutral-400 mt-1">
              Escanea el código QR con tu app de autenticación
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <QRCodeSVG value={secret.uri} size={170} level="M" />
            </div>

            <div className="flex-1 space-y-4 w-full">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 overflow-hidden">
                <p className="text-xs font-medium text-neutral-500 mb-1.5">
                  Código secreto (ingreso manual)
                </p>
                <div className="flex items-center gap-2 w-full">
                  <code className="flex-1 text-[10px] font-mono bg-white/5 px-2 py-1.5 rounded-lg border border-white/10 select-all truncate min-w-0 leading-relaxed text-neutral-300">
                    {secret.base32}
                  </code>
                  <Button
                    onClick={onCopy}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors shrink-0"
                    title="Copiar"
                  >
                    {copied ? (
                      <Check size={18} className="text-emerald-400" />
                    ) : (
                      <Copy size={18} className="text-neutral-400" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                Google Authenticator · Authy · Microsoft Authenticator
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-base font-medium text-neutral-300 mb-2">
                Verifica el código de 6 dígitos
              </label>
              <OtpInput inputRef={inputRef} value={otp} onChange={onOtpChange} className="text-3xl py-4" />
            </div>

            {error && <p className="text-base text-rose-400 text-center">{error}</p>}

            <Button
              type="submit"
              disabled={otp.length !== 6 || verifying}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-semibold text-base border-0 disabled:opacity-50 shadow-lg shadow-cyan-500/20"
            >
              {verifying ? 'Verificando…' : 'Verificar y despegar'}
              {!verifying && <ArrowRight size={20} />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
