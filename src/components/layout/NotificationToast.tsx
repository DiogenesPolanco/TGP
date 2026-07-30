import { useEffect, useState, useCallback, useRef } from 'react'
import { useAppStore } from '@/stores/appStore'
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react'

const iconMap = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
}

const accentColor = {
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-danger',
  info: 'text-info',
}

const MAX_TOASTS = 5

export function NotificationToast() {
  const { notifications, removeNotification } = useAppStore()
  const visible = notifications.slice(-MAX_TOASTS)

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col items-end gap-2 pointer-events-none max-w-sm">
      {visible.map((n) => (
        <ToastItem key={n.id} notification={n} onRemove={() => removeNotification(n.id)} />
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
  const [mounted, setMounted] = useState(false)
  const toastRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef(0)
  const [offsetX, setOffsetX] = useState(0)
  const duration = notification.duration ?? 4000

  useEffect(() => {
    // Trigger entrance animation on next frame
    requestAnimationFrame(() => setMounted(true))
  }, [])

  const handleClose = useCallback(() => {
    setExiting(true)
    setTimeout(onRemove, 250)
  }, [onRemove])

  // Auto-dismiss timer
  useEffect(() => {
    if (duration <= 0) return
    const timer = setTimeout(handleClose, duration)
    return () => clearTimeout(timer)
  }, [duration, handleClose])

  // Mouse drag to dismiss
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragStart.current = e.clientX
    const handleMove = (ev: PointerEvent) => {
      const delta = ev.clientX - dragStart.current
      if (delta > 0) setOffsetX(delta)
    }
    const handleUp = (ev: PointerEvent) => {
      const delta = ev.clientX - dragStart.current
      if (delta > 80) handleClose()
      else setOffsetX(0)
      document.removeEventListener('pointermove', handleMove)
      document.removeEventListener('pointerup', handleUp)
    }
    document.addEventListener('pointermove', handleMove)
    document.addEventListener('pointerup', handleUp)
  }, [handleClose])

  return (
    <div
      ref={toastRef}
      onPointerDown={handlePointerDown}
      className={`
        pointer-events-auto flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl shadow-lg border border-boundary
        min-w-[280px] max-w-sm w-full select-none cursor-default
        bg-white dark:bg-[#1a1a24]
        transition-all duration-250 ease-out
        ${exiting
          ? 'opacity-0 translate-x-8 scale-95'
          : mounted
            ? 'opacity-100 translate-x-0 scale-100'
            : 'opacity-0 translate-x-4'
        }
      `}
      style={{
        transform: offsetX > 0
          ? `translateX(${offsetX}px)`
          : exiting
            ? undefined
            : mounted
              ? undefined
              : undefined,
        opacity: offsetX > 0 ? Math.max(0, 1 - offsetX / 300) : undefined,
        transition: offsetX > 0 ? 'none' : undefined,
      }}
      role="alert"
    >
      <div className={`shrink-0 ${accentColor[notification.type]}`}>
        <Icon size={16} />
      </div>

      <p className="flex-1 min-w-0 text-sm text-default dark:text-white leading-snug font-medium">
        {notification.message}
      </p>

      <button
        onClick={handleClose}
        className="shrink-0 p-1 rounded-lg text-muted hover:text-default dark:hover:text-white hover:bg-subtle transition-all opacity-0 group-hover:opacity-100"
        aria-label="Cerrar"
      >
        <X size={13} />
      </button>
    </div>
  )
}
