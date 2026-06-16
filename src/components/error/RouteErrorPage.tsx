import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function RouteErrorPage() {
  const error = useRouteError()

  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Error inesperado'

  const isChunkError =
    message.includes('dynamically imported') ||
    message.includes('import()') ||
    message.includes('chunk') ||
    message.includes('loading chunk')

  return (
    <div className="min-h-screen bg-neutral-10 dark:bg-neutral-90 flex items-center justify-center p-4 relative overflow-hidden">
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
      <div
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="w-full max-w-md bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 shadow-2xl p-8 text-center space-y-6 relative">
        <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto">
          <AlertTriangle size={32} className="text-danger" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-neutral-90 dark:text-white">
            {isChunkError ? 'Actualización disponible' : 'Algo salió mal'}
          </h1>
          <p className="text-sm text-neutral-60 dark:text-neutral-40 leading-relaxed">
            {isChunkError
              ? 'La aplicación se actualizó recientemente. Recarga para obtener la última versión.'
              : 'Ocurrió un error inesperado al cargar esta sección. Puedes recargar o reportar el problema.'}
          </p>

          {!isChunkError && (
            <details className="mt-4 text-left">
              <summary className="text-xs text-neutral-50 cursor-pointer hover:text-neutral-70 dark:hover:text-neutral-30">
                Detalles técnicos
              </summary>
              <pre className="mt-2 p-3 bg-neutral-5 dark:bg-neutral-85 rounded-lg text-xs text-neutral-60 dark:text-neutral-40 overflow-auto max-h-32">
                {message}
              </pre>
            </details>
          )}
        </div>

        <div className="flex flex-col items-center gap-3">
          <Button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold text-base hover:bg-primary-dark transition-colors shadow-lg shadow-primary/25"
          >
            <RefreshCw size={18} />
            {isChunkError ? 'Recargar ahora' : 'Recargar página'}
          </Button>
          <a
            href="https://github.com/DiogenesPolanco/TGP/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-50 hover:text-neutral-70 dark:hover:text-neutral-30 transition-colors"
          >
            <Bug size={12} />
            Reportar error en GitHub
          </a>
        </div>
      </div>
    </div>
  )
}
