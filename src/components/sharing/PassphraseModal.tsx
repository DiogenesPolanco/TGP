import { useState } from 'react'
import { Lock, Eye, EyeOff, ArrowRight, X } from 'lucide-react'

interface Props {
  title?: string
  description?: string
  onSubmit: (passphrase: string) => void
  onSkip?: () => void
  onClose?: () => void
}

export function PassphraseModal({ title = 'Proteger con contraseña', description, onSubmit, onSkip, onClose }: Props) {
  const [pass, setPass] = useState('')
  const [show, setShow] = useState(false)

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-sm bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 shadow-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock size={18} className="text-primary" />
              <h3 className="text-base font-bold text-neutral-90 dark:text-white">{title}</h3>
            </div>
            {onClose && (
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-75">
                <X size={18} className="text-neutral-50" />
              </button>
            )}
          </div>

          {description && (
            <p className="text-sm text-neutral-60 dark:text-neutral-40 leading-relaxed">{description}</p>
          )}

          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="Ingresa una contraseña"
              className="w-full px-4 py-2.5 pr-10 rounded-xl border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm text-neutral-90 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && pass && onSubmit(pass)}
            />
            <button
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-neutral-10 dark:hover:bg-neutral-75"
            >
              {show ? <EyeOff size={16} className="text-neutral-50" /> : <Eye size={16} className="text-neutral-50" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSubmit(pass)}
              disabled={!pass}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              Proteger {pass ? <ArrowRight size={16} /> : null}
            </button>
            {onSkip && (
              <button onClick={onSkip} className="px-4 py-2.5 text-sm text-neutral-50 hover:text-neutral-90 dark:hover:text-white transition-colors">
                Sin contraseña
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
