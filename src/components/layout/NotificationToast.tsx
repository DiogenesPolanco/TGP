import { useEffect, useState } from 'react'
import { useAppStore } from '@/stores/appStore'
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react'

const iconMap = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
}

const styles = {
  success: {
    bg: 'bg-success',
    border: 'border-emerald-700',
    text: 'text-white',
    iconColor: 'text-white',
  },
  warning: {
    bg: 'bg-warning',
    border: 'border-amber-700',
    text: 'text-white',
    iconColor: 'text-white',
  },
  error: {
    bg: 'bg-danger',
    border: 'border-red-700',
    text: 'text-white',
    iconColor: 'text-white',
  },
  info: {
    bg: 'bg-info',
    border: 'border-blue-700',
    text: 'text-white',
    iconColor: 'text-white',
  },
}

export function NotificationToast() {
  const { notifications, removeNotification } = useAppStore()

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 w-full max-w-md pointer-events-none">
      {notifications.map((notification) => (
        <ToastItem
          key={notification.id}
          notification={notification}
          onRemove={() => removeNotification(notification.id)}
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
  const [progress, setProgress] = useState(100)
  const style = styles[notification.type]
  const duration = notification.duration ?? 8000

  useEffect(() => {
    const start = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)
      if (elapsed >= duration) {
        clearInterval(interval)
        onRemove()
      }
    }, 50)
    return () => clearInterval(interval)
  }, [duration, onRemove])

  return (
    <div
      className={`
        pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-2xl
        min-w-[320px] w-full
        animate-slide-in
        ${style.bg} ${style.text} ${style.border}
      `}
      role="alert"
    >
      <div className="shrink-0 mt-0.5">
        <Icon size={20} className={style.iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-snug">{notification.message}</p>
        <div className="mt-2 h-1 w-full rounded-full bg-white/30 overflow-hidden">
          <div
            className="h-full rounded-full bg-white/70 transition-all duration-[50ms] linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <button
        onClick={onRemove}
        className="shrink-0 p-1 rounded-md hover:bg-white/20 transition-colors"
        aria-label="Cerrar"
      >
        <X size={16} />
      </button>
    </div>
  )
}
