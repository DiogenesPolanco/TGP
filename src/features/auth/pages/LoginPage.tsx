import { useState, useEffect } from 'react'
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
import type { User } from '@/types/domain'
import { LockoutScreen } from '@/features/auth/components/LockoutScreen'
import { UserSelectionPanel } from '@/features/auth/components/UserSelectionPanel'
import { SetupPanel } from '@/features/auth/components/SetupPanel'
import { LoginPanel } from '@/features/auth/components/LoginPanel'

export function LoginPage({ onAuth }: { onAuth: () => void }) {
  const [mode, setMode] = useState<'setup' | 'login'>(isConfigured() ? 'login' : 'setup')
  const [secret] = useState<{ base32: string; uri: string } | null>(() =>
    mode === 'setup' ? generateSecret() : null,
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

  // Error countdown timer
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

  // Initial lockout check
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
        await confirmSetup(secret.base32, 24)
        setMode('login')
        onAuth()
        return
      }

      const activeUsers = await db.users.where('isActive').equals(1).toArray()
      if (activeUsers.length === 0) {
        const allUsers = await db.users.toArray()
        let defaultUser: User
        if (allUsers.length === 0) {
          const id = crypto.randomUUID()
          defaultUser = {
            id,
            email: 'admin@tgp.local',
            displayName: 'Administrador',
            role: 'admin' as User['role'],
            businessUnitIds: [],
            isActive: 1,
            otpRequestIntervalHours: 24,
            createdAt: new Date(),
          }
          await db.users.add(defaultUser)
        } else if (allUsers.length === 1) {
          defaultUser = allUsers[0] as User
          if (!defaultUser.isActive) {
            await db.users.update(defaultUser.id, { isActive: 1 } as any)
            defaultUser = { ...defaultUser, isActive: 1 }
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
        const user = activeUsers[0] as User
        useUserStore.getState().login(user)
        createSession(user.otpRequestIntervalHours ?? 1)
        onAuth()
        return
      }

      setUserList(activeUsers as User[])
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
    setOtp(value)
    setError('')
  }

  const handleSelectUser = (user: User) => {
    useUserStore.getState().login(user)
    createSession(user.otpRequestIntervalHours ?? 1)
    onAuth()
  }

  return (
    <div
      className="min-h-screen font-sans relative overflow-hidden"
      style={{ background: '#080c14', color: '#c8d0e0' }}
    >
      {/* Grid verde estilo landing */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,255,136,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      <div
        className="fixed top-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(0,255,136,0.06) 0%, transparent 70%)' }}
      />
      <div
        className="fixed bottom-[-300px] left-[-200px] w-[700px] h-[700px] rounded-full pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(255,185,0,0.04) 0%, transparent 70%)' }}
      />
      <div
        className="fixed inset-0 pointer-events-none z-[1]"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,136,0.015) 2px, rgba(0,255,136,0.015) 4px)',
        }}
      />

      <div className="relative z-10 w-full min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-5xl">
          <div className="rounded-3xl border border-white/10 shadow-2xl shadow-black/40 overflow-hidden bg-neutral-900/60 backdrop-blur-sm">
            {locked ? (
              <LockoutScreen lockoutMs={lockoutMs} />
            ) : userStep === 'selecting' ? (
              <UserSelectionPanel users={userList} onSelectUser={handleSelectUser} />
            ) : mode === 'setup' && secret ? (
              <SetupPanel
                secret={secret}
                otp={otp}
                error={error}
                verifying={verifying}
                copied={copied}
                onOtpChange={handleOtpChange}
                onSubmit={handleSubmit}
                onCopy={handleCopy}
              />
            ) : (
              <LoginPanel
                otp={otp}
                error={error}
                verifying={verifying}
                remaining={remaining}
                onOtpChange={handleOtpChange}
                onSubmit={handleSubmit}
              />
            )}
          </div>

          <p className="text-center text-xs text-neutral-500 mt-6 font-medium font-mono">
            LOCAL-FIRST · SIN CONEXIÓN EXTERNA
          </p>
        </div>
      </div>
    </div>
  )
}
