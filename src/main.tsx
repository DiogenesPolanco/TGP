/* eslint-disable react-refresh/only-export-components */

import { StrictMode, useState, useEffect, useCallback } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { getSession } from '@/services/auth/authService'
import { InactivityGuard } from '@/components/auth/InactivityGuard'
import './styles/globals.css'

function AuthGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    queueMicrotask(() => {
      const session = getSession()
      if (session) setAuthed(true)
      setChecking(false)
    })
  }, [sessionExpired])

  const handleInactivityExpired = useCallback(() => {
    setAuthed(false)
    setSessionExpired((s) => !s)
  }, [])

  const handleAuth = useCallback(() => {
    setAuthed(true)
  }, [])

  if (checking) {
    return (
      <div className="min-h-screen bg-neutral-10 dark:bg-neutral-90 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-30 border-t-primary rounded-full animate-spin" />
      </div>
    )
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
        <RouterProvider router={router} />
      </AuthGate>
    </QueryClientProvider>
  </StrictMode>,
)
