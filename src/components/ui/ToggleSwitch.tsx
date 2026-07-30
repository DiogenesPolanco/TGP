import { cn } from '@/lib/utils'

interface ToggleSwitchProps {
  checked: boolean
  onChange: () => void
  className?: string
}

/**
 * Toggle switch (role="switch") con animación suave.
 * Soportado por Tailwind v4 + diseño del sistema TGP.
 */
function ToggleSwitch({ checked, onChange, className }: ToggleSwitchProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onChange()
      }}
      type="button"
      role="switch"
      aria-checked={checked}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
        checked ? 'bg-neutral-60 dark:bg-neutral-40' : 'bg-neutral-20 dark:bg-neutral-70',
        className,
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out',
          checked ? 'translate-x-4' : 'translate-x-0',
        )}
      />
    </button>
  )
}

export { ToggleSwitch }
export default ToggleSwitch
