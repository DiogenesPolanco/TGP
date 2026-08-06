import { useRef, type KeyboardEvent } from 'react'
import { Moon, Sun } from 'lucide-react'

interface Props {
  theme: string
  onToggleTheme: () => void
  passphrase: string
  onPassphraseChange: (v: string) => void
  passError: boolean
  submitting: boolean
  onSubmit: () => void
}

export function MobilePassphraseGate({
  theme,
  onToggleTheme,
  passphrase,
  onPassphraseChange,
  passError,
  submitting,
  onSubmit,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="min-h-dvh bg-canvas text-default flex flex-col items-center justify-center p-6 relative">
      <button
        onClick={onToggleTheme}
        className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-neutral-20 dark:hover:bg-neutral-85 flex items-center justify-center transition-colors"
        aria-label="Cambiar tema"
      >
        {theme === 'light' ? (
          <Moon size={16} className="text-neutral-60" />
        ) : (
          <Sun size={16} className="text-neutral-40" />
        )}
      </button>
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-neutral-85 border border-boundary flex items-center justify-center text-neutral-50 dark:text-neutral-40">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-lg font-bold text-default">Command Center</h1>
            <p className="text-sm text-muted mt-1">Acceso restringido</p>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-85 rounded-2xl border border-boundary p-5 space-y-4">
          <p className="text-sm text-muted leading-relaxed">
            Este dashboard está protegido con cifrado de extremo a extremo. Ingresa la contraseña
            configurada en el escritorio.
          </p>
          <div className="space-y-2">
            <input
              ref={inputRef}
              type="password"
              value={passphrase}
              onChange={(e) => {
                onPassphraseChange(e.target.value)
              }}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter' && !submitting) onSubmit()
              }}
              placeholder="Contraseña"
              className="w-full px-4 py-3.5 bg-canvas border border-neutral-30 dark:border-neutral-60 rounded-xl text-default text-center text-lg tracking-widest placeholder:text-neutral-50 dark:placeholder:text-neutral-50 placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-primary/30 dark:focus:ring-white/15 transition-all"
              autoFocus
              disabled={submitting}
            />
            {passError && (
              <p className="text-xs text-danger text-center">
                Contraseña incorrecta. Intenta de nuevo.
              </p>
            )}
          </div>
          <button
            onClick={onSubmit}
            disabled={!passphrase || submitting}
            className="w-full py-3.5 bg-neutral-90 dark:bg-white text-white dark:text-neutral-90 font-semibold rounded-xl text-sm hover:bg-neutral-80 dark:hover:bg-neutral-20 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 dark:border-neutral-90/30 border-t-white dark:border-t-neutral-90 rounded-full animate-spin" />{' '}
                Desencriptando...
              </>
            ) : (
              'Desbloquear'
            )}
          </button>
        </div>
        <p className="text-xs text-neutral-50 text-center">
          Datos viajan cifrados desde Azure Blob Storage
        </p>
      </div>
    </div>
  )
}
