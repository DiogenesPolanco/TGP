import { DASHBOARD_WIDGETS, useDashboardConfigStore } from '@/stores/dashboardConfigStore'
import { X, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Props {
  onClose: () => void
}

export function DashboardConfigModal({ onClose }: Props) {
  const { enabledWidgets, toggleWidget, enableAll, disableAll } = useDashboardConfigStore()

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 transition-opacity" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-lg bg-card rounded-2xl border border-boundary shadow-2xl max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-boundary">
            <h2 className="text-lg font-bold text-neutral-90 dark:text-white">
              Personalizar Dashboard
            </h2>
            <Button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
            >
              <X size={20} className="text-neutral-50" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-1">
            <p className="text-sm text-muted mb-4">
              Selecciona los widgets que quieres ver en el dashboard. Los cambios se guardan
              automáticamente.
            </p>

            {DASHBOARD_WIDGETS.map((widget) => (
              <label
                key={widget.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-75 cursor-pointer transition-colors"
              >
                <div
                  className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
                    enabledWidgets[widget.id]
                      ? 'bg-primary/10 text-primary'
                      : 'bg-neutral-10 dark:bg-neutral-75 text-neutral-50'
                  }`}
                >
                  {enabledWidgets[widget.id] ? <Eye size={18} /> : <EyeOff size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-neutral-90 dark:text-white block">
                    {widget.title}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={enabledWidgets[widget.id] ?? true}
                  onChange={() => toggleWidget(widget.id)}
                  className="sr-only"
                />
                <div
                  className={`w-10 h-6 rounded-full transition-colors relative ${
                    enabledWidgets[widget.id] ? 'bg-primary' : 'bg-neutral-30 dark:bg-neutral-60'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      enabledWidgets[widget.id] ? 'translate-x-[18px]' : 'translate-x-0.5'
                    }`}
                  />
                </div>
              </label>
            ))}
          </div>

          <div className="flex items-center justify-between p-4 border-t border-boundary bg-neutral-5 dark:bg-neutral-85 rounded-b-2xl">
            <Button
              onClick={enableAll}
              className="text-sm text-muted hover:text-neutral-90 dark:hover:text-white transition-colors"
            >
              Mostrar todo
            </Button>
            <Button
              onClick={disableAll}
              className="text-sm text-muted hover:text-neutral-90 dark:hover:text-white transition-colors"
            >
              Ocultar todo
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
