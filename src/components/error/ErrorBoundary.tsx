import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="min-h-screen bg-neutral-10 dark:bg-neutral-90 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 shadow-2xl p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto">
              <AlertTriangle size={32} className="text-danger" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-neutral-90 dark:text-white">
                Algo salió mal
              </h1>
              <p className="text-sm text-neutral-60 dark:text-neutral-40 leading-relaxed">
                Se produjo un error inesperado. Puedes intentar recargar la página o reintentar.
              </p>
              {this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="text-xs text-neutral-50 cursor-pointer hover:text-neutral-70 dark:hover:text-neutral-30">
                    Detalles técnicos
                  </summary>
                  <pre className="mt-2 p-3 bg-neutral-5 dark:bg-neutral-85 rounded-lg text-xs text-neutral-60 dark:text-neutral-40 overflow-auto max-h-32">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center justify-center gap-3">
                <Button onClick={this.handleReset} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-70 dark:text-neutral-30 bg-neutral-10 dark:bg-neutral-75 hover:bg-neutral-20 dark:hover:bg-neutral-70 rounded-lg transition-colors">
                  <RefreshCw size={16} />
                  Reintentar
                </Button>
                <Button onClick={this.handleReload} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors">
                  <RefreshCw size={16} />
                  Recargar
                </Button>
              </div>
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

    return this.props.children
  }
}
