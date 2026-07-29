import { useAppStore } from '@/stores/appStore'

const CHUNK_LOAD_PATTERNS = [
  'Failed to fetch dynamically imported module',
  'Error loading dynamically imported module',
  'dynamically imported',
  'import()',
  'Loading chunk',
  'ChunkLoadError',
  'loading chunk',
]

export function setupGlobalErrorHandler() {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    const message = reason?.message || String(reason)

    console.error('[UnhandledRejection]', reason)

    const isChunkError = CHUNK_LOAD_PATTERNS.some((p) => message.includes(p))

    if (isChunkError) {
      event.preventDefault()
      console.warn('[ChunkLoad] Stale deployment detected — prompting reload')
      try {
        useAppStore.getState().addNotification({
          type: 'error',
          message: 'Hay una nueva versión de TGP disponible. Recarga la aplicación para aplicarla.',
          duration: 0,
        })
      } catch {}
    }
  })

  window.addEventListener('error', (event) => {
    if (event.target && (event.target as HTMLElement).tagName === 'IMG') {
      console.warn('[ImageError]', (event.target as HTMLImageElement).src)
      return
    }
    console.error('[GlobalError]', event.error || event.message)
  })
}
