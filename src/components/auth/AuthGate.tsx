import { useEffect, useState, useCallback, useRef, type ReactNode } from 'react'
import { TermsPage, isTermsAccepted, acceptTerms } from '@/features/auth/pages/TermsPage'
import { TermsDeclinedPage } from '@/features/auth/pages/TermsDeclinedPage'
import { getSession } from '@/services/auth/authService'
import { InactivityGuard } from '@/components/auth/InactivityGuard'
import { LoginPage } from '@/features/auth/pages/LoginPage'

const isPublicRoute = () => {
  if (typeof window === 'undefined') return false
  const { pathname } = window.location
  return pathname === '/' || pathname === '/docs' || pathname.startsWith('/public/')
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [showTerms, setShowTerms] = useState<'loading' | 'terms' | 'declined' | 'done'>('loading')
  const [pathname, setPathname] = useState(() => window.location.pathname)
  const expiryRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Detect SPA navigations (React Router uses pushState/replaceState)
  useEffect(() => {
    const originalPushState = history.pushState
    history.pushState = function (...args) {
      originalPushState.apply(this, args)
      setPathname(window.location.pathname)
    }
    const originalReplaceState = history.replaceState
    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args)
      setPathname(window.location.pathname)
    }
    const handlePopState = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => {
      history.pushState = originalPushState
      history.replaceState = originalReplaceState
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  useEffect(() => {
    if (isPublicRoute()) {
      setChecking(false)
      setShowTerms('done')
      return
    }
    queueMicrotask(() => {
      const session = getSession()
      if (session) setAuthed(true)
      setShowTerms(isTermsAccepted() ? 'done' : 'terms')
      setChecking(false)
    })
  }, [sessionExpired, pathname])

  // Periodic session expiry check — runs every 30s while authenticated
  useEffect(() => {
    if (!authed) return
    expiryRef.current = setInterval(() => {
      const session = getSession()
      if (!session) {
        setAuthed(false)
        setSessionExpired((s) => !s)
      }
    }, 30_000)
    return () => {
      if (expiryRef.current) clearInterval(expiryRef.current)
    }
  }, [authed])

  const handleInactivityExpired = useCallback(() => {
    setAuthed(false)
    setSessionExpired((s) => !s)
  }, [])

  const handleAuth = useCallback(() => {
    setAuthed(true)
  }, [])

  if (isPublicRoute()) {
    return <>{children}</>
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (showTerms === 'loading') {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (!authed && showTerms === 'terms') {
    return (
      <TermsPage
        onAccept={() => {
          acceptTerms()
          setShowTerms('done')
        }}
        onDecline={() => setShowTerms('declined')}
      />
    )
  }

  if (showTerms === 'declined') {
    return <TermsDeclinedPage onBack={() => setShowTerms('terms')} />
  }

  if (!authed) {
    return <LoginPage onAuth={handleAuth} />
  }

  return (
    <>
      <InactivityGuard onExpired={handleInactivityExpired} />
      {children}
    </>
  )
}
