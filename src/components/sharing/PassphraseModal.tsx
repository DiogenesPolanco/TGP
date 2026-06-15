import { useState } from 'react'
import { Eye, EyeOff, ArrowRight, Shield, Check, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Props {
  title?: string
  description?: string
  buttonLabel?: string
  duration?: number
  onDurationChange?: (hours: number) => void
  onSubmit: (passphrase: string, hours: number) => void
  onSkip?: (hours: number) => void
  onClose?: () => void
}

const DURATION_OPTIONS = [
  { label: '1 hora', hours: 1 },
  { label: '24 horas', hours: 24 },
  { label: '48 horas', hours: 48 },
  { label: '7 días', hours: 168 },
]

export function PassphraseModal({
  title = 'Proteger con contraseña',
  description,
  buttonLabel = 'Desbloquear',
  duration: initialDuration = 48,
  onDurationChange: _onDurationChange,
  onSubmit,
  onSkip,
  onClose,
}: Props) {
  const [pass, setPass] = useState('')
  const [show, setShow] = useState(false)
  const [hours, setHours] = useState(initialDuration)

  const handleHoursChange = (h: number) => {
    setHours(h)
    _onDurationChange?.(h)
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl bg-white/95 dark:bg-neutral-80/95 backdrop-blur-xl rounded-3xl border border-neutral-20/80 dark:border-neutral-70/80 shadow-2xl shadow-neutral-30/30 dark:shadow-black/30 overflow-hidden">
          <div className="flex flex-col sm:flex-row min-h-[360px]">
            {/* Left: branding */}
            <div className="sm:w-[42%] bg-gradient-to-br from-primary via-primary-dark to-[#03245E] p-6 sm:p-8 text-white flex flex-col relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{
                background: 'radial-gradient(circle at 30% 40%, white 0%, transparent 60%), radial-gradient(circle at 70% 80%, #4C9AFF 0%, transparent 50%)'
              }} />
              <div className="relative flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center p-1 shadow-sm">
                  <img src="/favicon.svg" alt="TGP" className="w-full h-full" />
                </div>
                <div>
                  <p className="text-base font-bold">TGP</p>
                  <p className="text-[10px] font-medium opacity-60 tracking-wide">Technology Governance Platform</p>
                </div>
              </div>
              <div className="relative flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={14} />
                  <span className="text-[10px] font-medium uppercase tracking-widest opacity-60">Datos protegidos</span>
                </div>
                <h3 className="text-xl font-bold leading-tight mb-3">Compartir datos</h3>
                <p className="text-sm leading-relaxed opacity-85 mb-3">
                  {description || 'Opcional: agrega una contraseña para cifrar los datos de extremo a extremo.'}
                </p>
                <ul className="space-y-1.5 text-sm">
                  <li className="flex items-start gap-2"><Check size={14} className="mt-0.5 shrink-0 opacity-70" /><span className="opacity-85">AES-GCM 256 bits</span></li>
                  <li className="flex items-start gap-2"><Check size={14} className="mt-0.5 shrink-0 opacity-70" /><span className="opacity-85">Enlace caduca automáticamente</span></li>
                  <li className="flex items-start gap-2"><Check size={14} className="mt-0.5 shrink-0 opacity-70" /><span className="opacity-85">Datos cifrados en reposo</span></li>
                </ul>
              </div>
            </div>
            {/* Right: controls */}
            <div className="sm:w-[58%] p-6 sm:p-8 bg-white/95 dark:bg-neutral-80/95 flex flex-col justify-center">
              <div className="max-w-xs mx-auto w-full space-y-5">
                <div>
                  <h3 className="text-lg font-bold text-neutral-90 dark:text-white">{title}</h3>
                  <p className="text-sm text-neutral-60 dark:text-neutral-40 mt-1">Configura el enlace compartido</p>
                </div>

                {/* Duration selector */}
                <div>
                  <label className="text-xs font-medium text-neutral-60 dark:text-neutral-40 mb-2 flex items-center gap-1.5">
                    <Clock size={13} />
                    Duración del enlace
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {DURATION_OPTIONS.map((opt) => (
                      <Button onClick={() => handleHoursChange(opt.hours)}>
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Passphrase input */}
                <div>
                  <label className="text-xs font-medium text-neutral-60 dark:text-neutral-40 mb-2">Contraseña opcional</label>
                  <div className="relative">
                    <input
                      type={show ? 'text' : 'password'}
                      value={pass}
                      onChange={(e) => setPass(e.target.value)}
                      placeholder="Contraseña"
                      className="w-full text-center text-lg tracking-[0.15em] px-4 py-3 rounded-xl border border-neutral-30 dark:border-neutral-60 bg-transparent text-neutral-90 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/25"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && pass && onSubmit(pass, hours)}
                    />
                    <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-50 hover:text-neutral-90 dark:hover:text-white transition-colors">
                      {show ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button onClick={() => onSkip?.(hours)} className="px-4 py-3 text-sm text-neutral-50 hover:text-neutral-90 dark:hover:text-white transition-colors shrink-0">
                    {buttonLabel} {pass ? <ArrowRight size={18} /> : null}
                  </Button>
                  {onSkip && (
                    <Button onClick={() => onSkip(hours)} className="px-4 py-3 text-sm text-neutral-50 hover:text-neutral-90 dark:hover:text-white transition-colors shrink-0">
                      Sin clave
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
