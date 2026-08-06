import { Users, ChevronRight } from 'lucide-react'
import { AuthBrandPanel, PerforatedDivider } from './loginComponents'
import type { User } from '@/types/domain'
import { Button } from '@/components/ui/Button'

export function UserSelectionPanel({
  users,
  onSelectUser,
}: {
  users: User[]
  onSelectUser: (user: User) => void
}) {
  return (
    <div className="flex flex-col lg:flex-row min-h-[480px]">
      <AuthBrandPanel>
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} />
          <span className="text-xs font-medium uppercase tracking-widest opacity-60">
            Identidad
          </span>
        </div>
        <h2 className="text-3xl font-bold leading-tight mb-4">¿Quién eres?</h2>
        <p className="text-base leading-relaxed opacity-85">
          Selecciona tu perfil para personalizar tu experiencia y determinar el intervalo de
          re-autenticación OTP.
        </p>
      </AuthBrandPanel>
      <PerforatedDivider />
      <div className="lg:w-[58%] p-8 lg:p-10 bg-white/95 dark:bg-neutral-80/95 flex flex-col justify-center">
        <div className="max-w-lg mx-auto w-full space-y-4">
          <h3 className="text-xl font-bold text-neutral-90 dark:text-white">
            Selecciona tu usuario
          </h3>
          <p className="text-sm text-muted">Cuentas activas encontradas en el sistema</p>
          <div className="space-y-2 max-h-[320px] overflow-y-auto">
            {users.map((u) => (
              <Button
                key={u.id}
                onClick={() => onSelectUser(u)}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-boundary hover:border-primary/40 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                    {u.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-90 dark:text-white">
                      {u.displayName}
                    </p>
                    <p className="text-xs text-neutral-50">
                      {u.email} · {u.role}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-40 dark:text-neutral-50">
                    {u.otpRequestIntervalHours ?? 1}h OTP
                  </span>
                  <ChevronRight
                    size={16}
                    className="text-neutral-30 group-hover:text-primary transition-colors"
                  />
                </div>
              </Button>
            ))}
          </div>
          <p className="text-xs text-neutral-50 dark:text-neutral-40 pt-2 border-t border-neutral-10 dark:border-neutral-80">
            La sesión expirará según el intervalo OTP configurado para cada usuario
          </p>
        </div>
      </div>
    </div>
  )
}
