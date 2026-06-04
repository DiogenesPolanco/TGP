import { useState, useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Shield, ShieldCheck, Copy, Check, Clock, ArrowRight, Lock } from 'lucide-react'
import {
  generateSecret,
  verifyTotp,
  confirmSetup,
  createSession,
  isConfigured,
  getSecret,
  getOtpRemainingMs,
  recordFailedAttempt,
  getLockoutStatus,
  resetRateLimit,
} from '@/services/auth/authService'

export function LoginPage({ onAuth }: { onAuth: () => void }) {
  const [mode, setMode] = useState<'setup' | 'login'>(
    isConfigured() ? 'login' : 'setup',
  )
  const [secret, setSecret] = useState<{ base32: string; uri: string } | null>(null)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [remaining, setRemaining] = useState(30)
  const [verifying, setVerifying] = useState(false)
  const [locked, setLocked] = useState(false)
  const [lockoutMs, setLockoutMs] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (mode === 'setup' && !secret) {
      setSecret(generateSecret())
    }
  }, [mode, secret])

  useEffect(() => {
    if (mode === 'login') {
      inputRef.current?.focus()
    }
  }, [mode])

  useEffect(() => {
    if (error) {
      const timer = setInterval(() => {
        const rem = Math.ceil(getOtpRemainingMs() / 1000)
        setRemaining(rem)
        if (rem <= 0) setError('')
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [error])

  // Lockout countdown
  useEffect(() => {
    if (!locked) return
    const timer = setInterval(() => {
      const status = getLockoutStatus()
      if (!status.locked) {
        setLocked(false)
        setLockoutMs(0)
        clearInterval(timer)
      } else {
        setLockoutMs(status.remainingMs)
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [locked])

  // Check lockout on mount when in login mode
  useEffect(() => {
    if (mode === 'login') {
      const status = getLockoutStatus()
      setLocked(status.locked)
      setLockoutMs(status.remainingMs)
    }
  }, [mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Check lockout first
    const lockStatus = getLockoutStatus()
    if (lockStatus.locked) {
      setLocked(true)
      setLockoutMs(lockStatus.remainingMs)
      return
    }

    setVerifying(true)

    try {
      let storedSecret: string | null = null
      if (isConfigured()) {
        storedSecret = await getSecret()
      } else {
        storedSecret = secret?.base32 ?? null
      }

      if (!storedSecret) {
        setError('Error de configuración. Re-inicia la app.')
        setVerifying(false)
        return
      }

      if (!verifyTotp(otp, storedSecret)) {
        const failResult = recordFailedAttempt()
        if (failResult.locked) {
          setLocked(true)
          setLockoutMs(failResult.remainingMs)
          setError('')
        } else {
          setError('Código inválido. Verifica que la hora de tu dispositivo esté sincronizada.')
        }
        setVerifying(false)
        return
      }

      if (mode === 'setup' && secret) {
        await confirmSetup(secret.base32)
        setMode('login')
      } else {
        createSession()
      }

      onAuth()
    } catch {
      setError('Error inesperado. Intenta de nuevo.')
    } finally {
      setVerifying(false)
      resetRateLimit()
    }
  }

  const handleCopy = () => {
    if (secret) {
      navigator.clipboard.writeText(secret.base32)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleOtpChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6)
    setOtp(digits)
    setError('')
  }

  function formatLockout(ms: number): string {
    const totalSec = Math.ceil(ms / 1000)
    const min = Math.floor(totalSec / 60)
    const sec = totalSec % 60
    return min > 0 ? `${min}m ${sec}s` : `${sec}s`
  }

  return (
    <div className="min-h-screen bg-neutral-10 dark:bg-neutral-90 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/favicon.svg" alt="TGP" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-neutral-90 dark:text-white">TGP</h1>
          <p className="text-sm text-neutral-60 dark:text-neutral-40 mt-1">
            Technology Governance Platform
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 shadow-xl p-8">
          {locked ? (
            /* ── Lockout screen ── */
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-danger/10 rounded-full flex items-center justify-center mx-auto">
                <Lock size={28} className="text-danger" />
              </div>
              <h2 className="text-lg font-semibold text-neutral-90 dark:text-white">
                Demasiados intentos
              </h2>
              <p className="text-sm text-neutral-60 dark:text-neutral-40">
                Cuenta bloqueada temporalmente por seguridad
              </p>
              <div className="flex items-center justify-center gap-2 text-danger font-medium">
                <Clock size={18} />
                <span>{formatLockout(lockoutMs)}</span>
              </div>
            </div>
          ) : mode === 'setup' && secret ? (
            /* ── Setup: QR + verify ── */
            <div className="space-y-6">
              <div className="text-center">
                <ShieldCheck size={40} className="text-success mx-auto mb-2" />
                <h2 className="text-lg font-semibold text-neutral-90 dark:text-white">
                  Configurar Autenticación
                </h2>
                <p className="text-sm text-neutral-60 dark:text-neutral-40 mt-1">
                  Escanea el código QR con tu app de autenticación
                </p>
              </div>

              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <QRCodeSVG value={secret.uri} size={200} level="M" />
                </div>
              </div>

              <div className="bg-neutral-10 dark:bg-neutral-70 rounded-lg p-3">
                <p className="text-xs text-neutral-50 mb-1">
                  Si no puedes escanear el QR, ingresa este código manualmente:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono bg-white dark:bg-neutral-80 px-2 py-1.5 rounded border border-neutral-20 dark:border-neutral-70 select-all">
                    {secret.base32}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors"
                    title="Copiar"
                  >
                    {copied ? (
                      <Check size={16} className="text-success" />
                    ) : (
                      <Copy size={16} className="text-neutral-50" />
                    )}
                  </button>
                </div>
              </div>

              <p className="text-xs text-neutral-50 text-center">
                Apps recomendadas: Google Authenticator, Authy, Microsoft Authenticator
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-2">
                    Verifica el código de 6 dígitos
                  </label>
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(e) => handleOtpChange(e.target.value)}
                    placeholder="000000"
                    className="w-full text-center text-2xl tracking-[0.5em] font-mono px-4 py-3 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-neutral-90 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                    maxLength={6}
                  />
                </div>

                {error && (
                  <p className="text-sm text-danger text-center">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={otp.length !== 6 || verifying}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {verifying ? 'Verificando…' : 'Verificar y Continuar'}
                  {!verifying && <ArrowRight size={18} />}
                </button>
              </form>
            </div>
          ) : (
            /* ── Login: OTP input ── */
            <div className="space-y-6">
              <div className="text-center">
                <Shield size={40} className="text-primary mx-auto mb-2" />
                <h2 className="text-lg font-semibold text-neutral-90 dark:text-white">
                  Autenticación OTP
                </h2>
                <p className="text-sm text-neutral-60 dark:text-neutral-40 mt-1">
                  Ingresa el código de 6 dígitos de tu app de autenticación
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(e) => handleOtpChange(e.target.value)}
                    placeholder="000000"
                    className="w-full text-center text-3xl tracking-[0.5em] font-mono px-4 py-4 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-neutral-90 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                    maxLength={6}
                  />
                </div>

                {error && (
                  <div className="text-center">
                    <p className="text-sm text-danger mb-1">{error}</p>
                    {remaining < 25 && (
                      <p className="text-xs text-neutral-50 flex items-center justify-center gap-1">
                        <Clock size={12} />
                        Espera al próximo código ({remaining}s)
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={otp.length !== 6 || verifying}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {verifying ? 'Verificando…' : 'Ingresar'}
                  {!verifying && <ArrowRight size={18} />}
                </button>
              </form>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-neutral-50 mt-6">
          Almacenamiento local encriptado • Sin conexión externa
        </p>
      </div>
    </div>
  )
}
