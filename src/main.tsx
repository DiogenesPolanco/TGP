/* eslint-disable react-refresh/only-export-components */

import { StrictMode, useState, useEffect, useCallback, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { TermsPage, isTermsAccepted, acceptTerms } from '@/features/auth/pages/TermsPage'
import { TermsDeclinedPage } from '@/features/auth/pages/TermsDeclinedPage'
import { getSession } from '@/services/auth/authService'
import { InactivityGuard } from '@/components/auth/InactivityGuard'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import { setupGlobalErrorHandler } from '@/services/notifications/globalErrorHandler'
import './styles/globals.css'

setupGlobalErrorHandler()

const isPublicRoute = () => {
  if (typeof window === 'undefined') return false
  const { pathname } = window.location
  return pathname === '/' || pathname === '/docs' || pathname.startsWith('/public/')
}

function AuthGate({ children }: { children: React.ReactNode }) {
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
      return
    }
    setChecking(true)
    setShowTerms('loading')
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthGate>
        <ErrorBoundary>
          <RouterProvider router={router} />
        </ErrorBoundary>
      </AuthGate>
    </QueryClientProvider>
  </StrictMode>,
)
