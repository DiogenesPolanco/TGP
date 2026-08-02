import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { AuthGate } from '@/components/auth/AuthGate'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import { setupGlobalErrorHandler } from '@/services/notifications/globalErrorHandler'
import { initializeDataLayer } from '@/services/data-layer'
import './styles/globals.css'

setupGlobalErrorHandler()
initializeDataLayer()

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
