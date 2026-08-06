import { Lock, Clock } from 'lucide-react'

function formatLockout(ms: number): string {
  const totalSec = Math.ceil(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return min > 0 ? `${min}m ${sec}s` : `${sec}s`
}

export function LockoutScreen({ lockoutMs }: { lockoutMs: number }) {
  return (
    <div className="text-center space-y-4 p-8">
      <div className="w-14 h-14 bg-danger/10 rounded-full flex items-center justify-center mx-auto">
        <Lock size={28} className="text-danger" />
      </div>
      <h2 className="text-lg font-semibold text-neutral-90 dark:text-white">Demasiados intentos</h2>
      <p className="text-sm text-muted">Cuenta bloqueada temporalmente por seguridad</p>
      <div className="flex items-center justify-center gap-2 text-danger font-medium">
        <Clock size={18} />
        <span>{formatLockout(lockoutMs)}</span>
      </div>
    </div>
  )
}
