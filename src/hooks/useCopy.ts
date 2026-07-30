import { useState, useRef, useCallback } from 'react'

/**
 * Hook para copiar texto al portapapeles con feedback visual.
 * Retorna `copiedId` (el ID del item copiado actualmente, o null)
 * y `copy(text, id)` para copiar.
 *
 * @param delay Duración del feedback "copiado" en ms (default: 1800)
 */
export function useCopy(delay = 1800) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const copy = useCallback(
    async (text: string, id: string) => {
      try {
        await navigator.clipboard.writeText(text)
        setCopiedId(id)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setCopiedId(null), delay)
      } catch {
        // Fallback silencioso si el browser no permite clipboard API
        setCopiedId(null)
      }
    },
    [delay],
  )

  return { copiedId, copy }
}
