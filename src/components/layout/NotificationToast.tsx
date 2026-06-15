import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/stores/appStore'
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const iconMap = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
}

const bgMap = {
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-danger',
  info: 'bg-info',
}

const MAX_TOASTS = 5

export function NotificationToast() {
  const { notifications, removeNotification } = useAppStore()
  const visible = notifications.slice(-MAX_TOASTS)

  if (notifications.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse items-end gap-2 pointer-events-none max-w-sm">
      {visible.map((n) => (
        <ToastItem
          key={n.id}
          notification={n}
          onRemove={() => removeNotification(n.id)}
        />
      ))}
    </div>
  )
}

function ToastItem({
  notification,
  onRemove,
}: {
  notification: { id: string; type: keyof typeof iconMap; message: string; duration?: number }
  onRemove: () => void
}) {
  const Icon = iconMap[notification.type]
  const [exiting, setExiting] = useState(false)
  const [progress, setProgress] = useState(100)
  const duration = notification.duration ?? 4000

  const handleClose = useCallback(() => {
    setExiting(true)
    setTimeout(onRemove, 200)
  }, [onRemove])

  useEffect(() => {
    const start = Date.now()
    const timer = setInterval(() => {
      const elapsed = Date.now() - start
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)
      if (elapsed >= duration) {
        clearInterval(timer)
        handleClose()
      }
    }, 100)
    return () => clearInterval(timer)
  }, [duration, handleClose])

  return (
    <div
      className={`
        pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl border border-white/20
        min-w-[300px] w-full transition-all duration-200 ease-in-out
        ${bgMap[notification.type]} text-white
        ${exiting ? 'opacity-0 scale-95 translate-x-4' : 'opacity-100 scale-100 translate-x-0'}
      `}
      role="alert"
    >
      <div className="shrink-0 mt-0.5">
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-snug">{notification.message}</p>
        <div className="mt-2 h-1 w-full rounded-full bg-white/30 overflow-hidden">
          <div
            className="h-full rounded-full bg-white/60 transition-all duration-100 linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <Button onClick={handleClose} className="shrink-0 p-0.5 rounded hover:bg-white/20 transition-colors" aria-label="Cerrar">
        <X size={14} />
      </Button>
    </div>
  )
}
