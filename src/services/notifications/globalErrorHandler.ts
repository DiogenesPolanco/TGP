export function setupGlobalErrorHandler() {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[UnhandledRejection]', event.reason)
  })

  window.addEventListener('error', (event) => {
    if (event.target && (event.target as HTMLElement).tagName === 'IMG') {
      console.warn('[ImageError]', (event.target as HTMLImageElement).src)
      return
    }
    console.error('[GlobalError]', event.error || event.message)
  })
}
