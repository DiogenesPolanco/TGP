import { useState, useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Shield, ShieldCheck, Copy, Check, Clock, ArrowRight, Lock, Users, ChevronRight } from 'lucide-react'
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
import { db } from '@/services/db/database'
import { useUserStore } from '@/stores/userStore'
import type { User, UserRole } from '@/types/domain'
import { Button } from '@/components/ui/Button'

export function LoginPage({ onAuth }: { onAuth: () => void }) {
  const [mode, setMode] = useState<'setup' | 'login'>(
    isConfigured() ? 'login' : 'setup',
  )
  const [secret] = useState<{ base32: string; uri: string } | null>(
    () => mode === 'setup' ? generateSecret() : null
  )
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [remaining, setRemaining] = useState(30)
  const [verifying, setVerifying] = useState(false)
  const [locked, setLocked] = useState(false)
  const [lockoutMs, setLockoutMs] = useState(0)
  const [userStep, setUserStep] = useState<'idle' | 'selecting' | 'complete'>('idle')
  const [userList, setUserList] = useState<User[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    if (mode === 'login') {
      queueMicrotask(() => {
        const status = getLockoutStatus()
        setLocked(status.locked)
        setLockoutMs(status.remainingMs)
      })
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
        createSession(1)
        onAuth()
        return
      }

      const activeUsers = await db.users.where('isActive').equals(1).toArray()
      if (activeUsers.length === 0) {
        // Auto-crear usuario administrador por defecto
        const allUsers = await db.users.toArray()
        let defaultUser: User
        if (allUsers.length === 0) {
          const id = crypto.randomUUID()
          defaultUser = {
            id,
            email: 'admin@tgp.local',
            displayName: 'Administrador',
            role: 'admin' as UserRole,
            businessUnitIds: [],
            isActive: true,
            otpRequestIntervalHours: 24,
            createdAt: new Date(),
          }
          await db.users.add(defaultUser)
        } else if (allUsers.length === 1) {
          defaultUser = allUsers[0] as User
          if (!defaultUser.isActive) {
            await db.users.update(defaultUser.id, { isActive: 1 } as any)
            defaultUser = { ...defaultUser, isActive: true }
          }
        } else {
          defaultUser = allUsers[0] as User
        }
        useUserStore.getState().login(defaultUser)
        createSession(defaultUser.otpRequestIntervalHours ?? 24)
        onAuth()
        return
      }

      if (activeUsers.length === 1) {
        const user = activeUsers[0]
        useUserStore.getState().login(user)
        createSession(user.otpRequestIntervalHours ?? 1)
        onAuth()
        return
      }

      setUserList(activeUsers)
      setUserStep('selecting')
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
    <div className="min-h-screen bg-neutral-10 dark:bg-neutral-90 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Gradient mesh background */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 20% 30%, #0052CC 0%, transparent 60%),
            radial-gradient(ellipse 50% 60% at 80% 70%, #C85A48 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 50% 50%, #36B37E 0%, transparent 50%)
          `,
        }}
      />

      {/* Decorative dots pattern (subtle) */}
      <div
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="w-full max-w-5xl relative">
        <div className="bg-white/95 dark:bg-neutral-80/95 backdrop-blur-xl rounded-3xl border border-neutral-20/80 dark:border-neutral-70/80 shadow-2xl shadow-neutral-30/30 dark:shadow-black/30 overflow-hidden">
          {locked ? (
            /* ── Lockout screen ── */
            <div className="text-center space-y-4 p-8">
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
          ) : userStep === 'selecting' ? (
            /* ── User selection after OTP ── */
            <div className="flex flex-col lg:flex-row min-h-[480px]">
              <div className="lg:w-[42%] bg-gradient-to-br from-primary via-primary-dark to-[#03245E] p-8 lg:p-10 text-white flex flex-col relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{
                  background: 'radial-gradient(circle at 30% 40%, white 0%, transparent 60%), radial-gradient(circle at 70% 80%, #4C9AFF 0%, transparent 50%)'
                }} />
                <div className="relative flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-white backdrop-blur flex items-center justify-center p-1.5 shadow-sm">
                    <img src="/favicon.svg" alt="TGP" className="w-full h-full" />
                  </div>
                  <div>
                    <p className="text-xl font-bold tracking-tight">TGP</p>
                    <p className="text-[11px] font-medium opacity-60 tracking-wide">Technology Governance Platform</p>
                  </div>
                </div>
                <div className="relative flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-4">
                    <Users size={16} />
                    <span className="text-xs font-medium uppercase tracking-widest opacity-60">Identidad</span>
                  </div>
                  <h2 className="text-3xl font-bold leading-tight mb-4">
                    ¿Quién eres?
                  </h2>
                  <p className="text-base leading-relaxed opacity-85">
                    Selecciona tu perfil para personalizar tu experiencia y determinar el intervalo de re-autenticación OTP.
                  </p>
                </div>
              </div>
              <div className="hidden lg:block w-5 bg-white/95 dark:bg-neutral-80/95 relative">
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div key={i} className="w-2.5 h-2.5 rounded-full bg-neutral-20 dark:border-neutral-70" />
                  ))}
                </div>
              </div>
              <div className="lg:w-[58%] p-8 lg:p-10 bg-white/95 dark:bg-neutral-80/95 flex flex-col justify-center">
                <div className="max-w-lg mx-auto w-full space-y-4">
                  <h3 className="text-xl font-bold text-neutral-90 dark:text-white">Selecciona tu usuario</h3>
                  <p className="text-sm text-neutral-60 dark:text-neutral-40">Cuentas activas encontradas en el sistema</p>
                  <div className="space-y-2 max-h-[320px] overflow-y-auto">
                    {userList.map((u) => (
                      <Button key={u.id} onClick={() => {
                        useUserStore.getState().login(u)
                        createSession(u.otpRequestIntervalHours ?? 1)
                        onAuth()
                      }}
                        className="w-full flex items-center justify-between p-4 rounded-xl border border-neutral-20 dark:border-neutral-70 hover:border-primary/40 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all group text-left">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                            {u.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-neutral-90 dark:text-white">{u.displayName}</p>
                            <p className="text-xs text-neutral-50">{u.email} · {u.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-neutral-40 dark:text-neutral-50">{u.otpRequestIntervalHours ?? 1}h OTP</span>
                          <ChevronRight size={16} className="text-neutral-30 group-hover:text-primary transition-colors" />
                        </div>
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-neutral-50 dark:text-neutral-40 pt-2 border-t border-neutral-10 dark:border-neutral-80">
                    La sesión expirará según el intervalo OTP configurado para cada usuario
                  </p>
                </div>
              </div>
            </div>
          ) : mode === 'setup' && secret ? (
            /* ── Boarding-pass style setup ── */
            <div className="flex flex-col lg:flex-row min-h-[520px]">
              {/* Left: Vision + logo inside */}
              <div className="lg:w-[42%] bg-gradient-to-br from-primary via-primary-dark to-[#03245E] p-8 lg:p-10 text-white flex flex-col relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{
                  background: 'radial-gradient(circle at 30% 40%, white 0%, transparent 60%), radial-gradient(circle at 70% 80%, #4C9AFF 0%, transparent 50%)'
                }} />

                {/* Logo inside card */}
                  <div className="relative flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-white backdrop-blur flex items-center justify-center p-1.5 shadow-sm">
                      <img src="/favicon.svg" alt="TGP" className="w-full h-full" />
                    </div>
                    <div>
                      <p className="text-xl font-bold tracking-tight">TGP</p>
                      <p className="text-[11px] font-medium opacity-60 tracking-wide">Technology Governance Platform</p>
                    </div>
                  </div>

                <div className="relative flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck size={16} />
                    <span className="text-xs font-medium uppercase tracking-widest opacity-60">Setup · Primer acceso</span>
                  </div>
                  <h2 className="text-3xl font-bold leading-tight mb-4">
                    Tu gobierno<br />tecnológico<br />empieza aquí
                  </h2>
                  <p className="text-base leading-relaxed opacity-85 mb-5">
                    TGP unifica cada dimensión de tu portafolio en un solo tablero de comando.
                    Desde la salud de tus aplicaciones hasta el rendimiento de tus equipos,
                    todo converge en decisiones más rápidas, informadas y estratégicas.
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
                </div>

                <div className="relative mt-6 pt-4 border-t border-white/15">
                  <p className="text-sm opacity-60 leading-relaxed">
                    Datos en tu navegador · Sin conexión externa · Cifrado local
                  </p>
                </div>
              </div>

              {/* Divider: perforated line */}
              <div className="hidden lg:block w-5 bg-white/95 dark:bg-neutral-80/95 relative">
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div key={i} className="w-2.5 h-2.5 rounded-full bg-neutral-20 dark:bg-neutral-70" />
                  ))}
                </div>
              </div>

              {/* Right: QR + verify */}
              <div className="lg:w-[58%] p-8 lg:p-10 bg-white/95 dark:bg-neutral-80/95 flex flex-col justify-center">
                <div className="max-w-lg mx-auto w-full space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-neutral-90 dark:text-white">Configura tu acceso</h3>
                    <p className="text-base text-neutral-60 dark:text-neutral-40 mt-1">
                      Escanea el código QR con tu app de autenticación
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start gap-6">
                    <div className="bg-neutral-5 dark:bg-neutral-85 rounded-2xl p-4 border border-neutral-20 dark:border-neutral-70">
                      <QRCodeSVG value={secret.uri} size={170} level="M" />
                    </div>

                    <div className="flex-1 space-y-4 w-full">
                      <div className="bg-neutral-5 dark:bg-neutral-85 rounded-xl p-4 border border-neutral-20 dark:border-neutral-70 overflow-hidden">
                        <p className="text-xs font-medium text-neutral-50 mb-1.5">Código secreto (ingreso manual)</p>
                        <div className="flex items-center gap-2 w-full">
                          <code className="flex-1 text-[10px] font-mono bg-white dark:bg-neutral-80 px-2 py-1.5 rounded-lg border border-neutral-20 dark:border-neutral-70 select-all truncate min-w-0 leading-relaxed">
                            {secret.base32}
                          </code>
                          <Button onClick={handleCopy} className="p-2 rounded-lg hover:bg-neutral-20 dark:hover:bg-neutral-70 transition-colors shrink-0" title="Copiar">
                            {copied ? <Check size={18} className="text-success" /> : <Copy size={18} className="text-neutral-50" />}
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-neutral-50">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        Google Authenticator · Authy · Microsoft Authenticator
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-base font-medium text-neutral-70 dark:text-neutral-30 mb-2">
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
                        className="w-full text-center text-3xl tracking-[0.5em] font-mono px-4 py-4 rounded-xl border border-neutral-30 dark:border-neutral-60 bg-transparent text-neutral-90 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/25"
                        maxLength={6}
                      />
                    </div>

                    {error && <p className="text-base text-danger text-center">{error}</p>}

                    <Button
                      type="submit"
                      disabled={otp.length !== 6 || verifying}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-white rounded-xl font-semibold text-base hover:bg-primary-dark transition-colors disabled:opacity-50 shadow-lg shadow-primary/25"
                    >
                      {verifying ? 'Verificando…' : 'Verificar y despegar'}
                      {!verifying && <ArrowRight size={20} />}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            /* ── Login: boarding-pass style ── */
            <div className="flex flex-col lg:flex-row min-h-[480px]">
              {/* Left: Brand + secure access messaging */}
              <div className="lg:w-[42%] bg-gradient-to-br from-primary via-primary-dark to-[#03245E] p-8 lg:p-10 text-white flex flex-col relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{
                  background: 'radial-gradient(circle at 30% 40%, white 0%, transparent 60%), radial-gradient(circle at 70% 80%, #4C9AFF 0%, transparent 50%)'
                }} />
                <div className="relative flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-white backdrop-blur flex items-center justify-center p-1.5 shadow-sm">
                    <img src="/favicon.svg" alt="TGP" className="w-full h-full" />
                  </div>
                  <div>
                    <p className="text-xl font-bold tracking-tight">TGP</p>
                    <p className="text-[11px] font-medium opacity-60 tracking-wide">Technology Governance Platform</p>
                  </div>
                </div>
                <div className="relative flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield size={16} />
                    <span className="text-xs font-medium uppercase tracking-widest opacity-60">Acceso seguro</span>
                  </div>
                  <h2 className="text-3xl font-bold leading-tight mb-4">
                    Tu tablero de<br />gobierno<br />tecnológico
                  </h2>
                  <p className="text-base leading-relaxed opacity-85 mb-5">
                    Accede a tu portafolio de aplicaciones, métricas DORA, riesgos,
                    vulnerabilidades y más en un solo lugar.
                  </p>
                  <ul className="space-y-3 text-base">
                    {['THI y KPIs en tiempo real', 'Alertas automáticas', 'Equipos y OKRs', 'Obsolescencia EOL'].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check size={16} className="mt-0.5 shrink-0 opacity-70" />
                        <span className="opacity-90">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="relative mt-6 pt-4 border-t border-white/15">
                  <p className="text-sm opacity-60 leading-relaxed">
                    Almacenamiento local encriptado · Sin conexión externa
                  </p>
                </div>
              </div>

              {/* Divider: perforated line */}
              <div className="hidden lg:block w-5 bg-white/95 dark:bg-neutral-80/95 relative">
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div key={i} className="w-2.5 h-2.5 rounded-full bg-neutral-20 dark:bg-neutral-70" />
                  ))}
                </div>
              </div>

              {/* Right: OTP input */}
              <div className="lg:w-[58%] p-8 lg:p-10 bg-white/95 dark:bg-neutral-80/95 flex flex-col justify-center">
                <div className="max-w-sm mx-auto w-full space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-neutral-90 dark:text-white">Autenticación OTP</h3>
                    <p className="text-base text-neutral-60 dark:text-neutral-40 mt-1">
                      Ingresa el código de 6 dígitos de tu app
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <input
                        ref={inputRef}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={otp}
                        onChange={(e) => handleOtpChange(e.target.value)}
                        placeholder="000000"
                        className="w-full text-center text-4xl tracking-[0.5em] font-mono px-4 py-5 rounded-xl border border-neutral-30 dark:border-neutral-60 bg-transparent text-neutral-90 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/25 transition-shadow duration-300"
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

                    <Button
                      type="submit"
                      disabled={otp.length !== 6 || verifying}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-white rounded-xl font-semibold text-base hover:bg-primary-dark transition-all disabled:opacity-50 shadow-lg shadow-primary/25"
                    >
                      {verifying ? 'Verificando…' : 'Ingresar'}
                      {!verifying && <ArrowRight size={20} />}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-neutral-50 mt-6 font-medium">
          Almacenamiento local encriptado · Sin conexión externa
        </p>
      </div>
    </div>
  )
}
