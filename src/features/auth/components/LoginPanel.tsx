import { useEffect, useRef } from 'react'
import { Shield, Check, ArrowRight, Clock } from 'lucide-react'
import { AuthBrandPanel, PerforatedDivider, OtpInput } from './loginComponents'
import { Button } from '@/components/ui/Button'

export function LoginPanel({
  otp,
  error,
  verifying,
  remaining,
  onOtpChange,
  onSubmit,
}: {
  otp: string
  error: string
  verifying: boolean
  remaining: number
  onOtpChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div className="flex flex-col lg:flex-row min-h-[480px]">
      <AuthBrandPanel>
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} />
          <span className="text-xs font-medium uppercase tracking-widest opacity-60">
            Acceso seguro
          </span>
        </div>
        <h2 className="text-3xl font-bold leading-tight mb-4">
          Tu tablero de
          <br />
          gobierno
          <br />
          tecnológico
        </h2>
        <p className="text-base leading-relaxed opacity-85 mb-5">
          Accede a tu portafolio de aplicaciones, métricas DORA, riesgos, vulnerabilidades
          y más en un solo lugar.
        </p>
        <ul className="space-y-3 text-base">
          {['THI y KPIs en tiempo real', 'Alertas automáticas', 'Equipos y OKRs', 'Obsolescencia EOL'].map(
            (item, i) => (
              <li key={i} className="flex items-start gap-3">
                <Check size={16} className="mt-0.5 shrink-0 opacity-70" />
                <span className="opacity-90">{item}</span>
              </li>
            ),
          )}
        </ul>
      </AuthBrandPanel>
      <PerforatedDivider />
      <div className="lg:w-[58%] p-8 lg:p-10 bg-gradient-to-b from-[#0e0e18] to-neutral-900 flex flex-col justify-center">
        <div className="max-w-sm mx-auto w-full space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white">
              Autenticación OTP
            </h3>
            <p className="text-base text-neutral-400 mt-1">
              Ingresa el código de 6 dígitos de tu app
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <OtpInput inputRef={inputRef} value={otp} onChange={onOtpChange} className="text-4xl py-5" />
            </div>

            {error && (
              <div className="text-center">
                <p className="text-sm text-rose-400 mb-1">{error}</p>
                {remaining < 25 && (
                  <p className="text-xs text-neutral-500 flex items-center justify-center gap-1">
                    <Clock size={12} />
                    Espera al próximo código ({remaining}s)
                  </p>
                )}
              </div>
            )}

            <Button
              type="submit"
              disabled={otp.length !== 6 || verifying}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-semibold text-base border-0 disabled:opacity-50 shadow-lg shadow-cyan-500/20"
            >
              {verifying ? 'Verificando…' : 'Ingresar'}
              {!verifying && <ArrowRight size={20} />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
