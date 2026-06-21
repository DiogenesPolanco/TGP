import { useEffect, useState, useCallback, startTransition } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { useConfirmStore } from '@/stores/confirmStore'
import { Button } from '@/components/ui/Button'

export function ConfirmDialog() {
  const { message, dismiss } = useConfirmStore()
  const [visible, setVisible] = useState(false)
  const open = message.length > 0

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => startTransition(() => setVisible(true)))
    } else {
      startTransition(() => setVisible(false))
    }
  }, [open])

  const handleConfirm = useCallback(() => {
    setVisible(false)
    // Wait for close animation before resolving
    setTimeout(() => dismiss(true), 200)
  }, [dismiss])

  const handleCancel = useCallback(() => {
    setVisible(false)
    setTimeout(() => dismiss(false), 200)
  }, [dismiss])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, handleCancel])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-200 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`pointer-events-auto w-full max-w-sm bg-card rounded-2xl border border-boundary shadow-2xl p-6 transition-all duration-200 ${
            visible
              ? 'translate-y-0 opacity-100 scale-100'
              : 'translate-y-4 opacity-0 scale-95'
          }`}
        >
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-warning" />
            </div>

            <div className="flex-1 min-w-0">
              {/* Close button */}
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-semibold text-neutral-90 dark:text-white">
                  Confirmar
                </h3>
                <Button onClick={handleCancel} className="p-0.5 rounded-md hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors">
                  <X size={16} className="text-neutral-50" />
                </Button>
              </div>

              {/* Message */}
              <p className="text-sm text-muted leading-relaxed">
                {message}
              </p>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 mt-5">
                <Button onClick={handleCancel} className="px-4 py-2 text-sm font-medium text-secondary hover:bg-neutral-10 dark:hover:bg-neutral-70 rounded-lg transition-colors">
                  Cancelar
                </Button>
                <Button onClick={handleConfirm} className="px-4 py-2 text-sm font-medium bg-danger text-white rounded-lg hover:bg-danger-dark transition-colors">
                  Confirmar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
