import { useEffect, useState, useCallback, useRef } from 'react'
import { LogOut, Clock } from 'lucide-react'
import {
  startInactivityWatch,
  stopInactivityWatch,
  getWarningRemainingMs,
  dismissInactivityWarning,
  WARNING_DURATION_MS,
} from '@/services/auth/inactivityService'
import { logout } from '@/services/auth/authService'
import { Button } from '@/components/ui/Button'

interface InactivityGuardProps {
  onExpired: () => void
}

export function InactivityGuard({ onExpired }: InactivityGuardProps) {
  const [showingWarning, setShowingWarning] = useState(false)
  const [remaining, setRemaining] = useState(WARNING_DURATION_MS)
  const [warningVisible, setWarningVisible] = useState(false)

  // Ref para evitar que cambios en showingWarning disparen re-ejecución del effect principal
  const warningActiveRef = useRef(false)

  const handleExpired = useCallback(() => {
    setShowingWarning(false)
    setWarningVisible(false)
    warningActiveRef.current = false
    logout()
    onExpired()
  }, [onExpired])

  const handleDismiss = useCallback(() => {
    setShowingWarning(false)
    setWarningVisible(false)
    warningActiveRef.current = false
    dismissInactivityWarning()
  }, [])

  // Effect principal: se registra UNA SOLA VEZ al montar
  useEffect(() => {
    startInactivityWatch((phase) => {
      if (phase === 'warning') {
        if (warningActiveRef.current) {
          // Señal de "dismiss" — el usuario hizo actividad durante la advertencia
          setShowingWarning(false)
          setWarningVisible(false)
          warningActiveRef.current = false
          return
        }
        warningActiveRef.current = true
        setShowingWarning(true)
        requestAnimationFrame(() => setWarningVisible(true))
      } else if (phase === 'expired') {
        handleExpired()
      }
    })

    return () => {
      stopInactivityWatch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // ⚠️ Sin dependencias de estado — se monta/desmonta una sola vez

  // Timer de conteo regresivo: se activa solo cuando la advertencia está visible
  useEffect(() => {
    if (!showingWarning) return
    const interval = setInterval(() => {
      setRemaining(getWarningRemainingMs())
    }, 200)
    return () => clearInterval(interval)
  }, [showingWarning])

  // Cerrar con Escape
  useEffect(() => {
    if (!showingWarning) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showingWarning, handleDismiss])

  if (!showingWarning) return null

  const remainingSec = Math.ceil(remaining / 1000)
  const isUrgent = remainingSec <= 15

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ${
          warningVisible ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`pointer-events-auto w-full max-w-md bg-card rounded-2xl border border-boundary shadow-2xl p-8 transition-all duration-300 ${
            warningVisible
              ? 'translate-y-0 opacity-100 scale-100'
              : 'translate-y-4 opacity-0 scale-95'
          }`}
        >
          <div className="text-center space-y-4">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
                isUrgent
                  ? 'bg-danger/10 animate-pulse'
                  : 'bg-warning/10'
              }`}
            >
              <Clock
                size={32}
                className={isUrgent ? 'text-danger' : 'text-warning'}
              />
            </div>

            <h2 className="text-xl font-semibold text-neutral-90 dark:text-white">
              Sesión por expirar
            </h2>

            <p className="text-sm text-muted">
              Tu sesión se cerrará automáticamente por inactividad. Mueve el mouse o presiona una tecla para continuar.
            </p>

            <div className="flex items-center justify-center gap-3">
              <div
                className={`text-3xl font-mono font-bold tabular-nums ${
                  isUrgent ? 'text-danger' : 'text-primary'
                }`}
              >
                {remainingSec}
              </div>
              <span className="text-sm text-neutral-50">segundos</span>
            </div>

            <div className="h-2 bg-neutral-20 dark:bg-neutral-70 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                  isUrgent
                    ? 'bg-danger'
                    : 'bg-primary'
                }`}
                style={{
                  width: `${(remaining / WARNING_DURATION_MS) * 100}%`,
                }}
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={handleExpired}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-neutral-30 dark:border-neutral-60 text-secondary rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors text-sm font-medium"
              >
                <LogOut size={16} />
                Cerrar sesión
              </Button>
              <Button
                onClick={handleDismiss}
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
              >
                Continuar sesión
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
