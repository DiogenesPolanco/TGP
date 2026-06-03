import { useEffect } from 'react'
import { useAppStore } from '@/stores/appStore'
import { cn } from '@/lib/utils'
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react'

const iconMap = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
}

const colorMap = {
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  error: 'bg-danger/10 text-danger border-danger/20',
  info: 'bg-info/10 text-info border-info/20',
}

export function NotificationToast() {
  const { notifications, removeNotification } = useAppStore()

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2">
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

  useEffect(() => {
    const duration = notification.duration ?? 5000
    const timer = setTimeout(onRemove, duration)
    return () => clearTimeout(timer)
  }, [notification.duration, onRemove])

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg min-w-[300px] max-w-[400px]',
        colorMap[notification.type]
      )}
    >
      <Icon size={20} />
      <p className="flex-1 text-sm font-medium">{notification.message}</p>
      <button
        onClick={onRemove}
        className="p-1 rounded-md hover:bg-black/5 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  )
}
