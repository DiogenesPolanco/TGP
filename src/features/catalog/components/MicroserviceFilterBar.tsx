import { Search, Filter, X } from 'lucide-react'
import { Select } from '@/components/ui/Select'
import { lifecycleLabel } from './microserviceConstants'
import { Button } from '@/components/ui/Button'

interface AppOption {
  id: string
  name: string
}

interface Props {
  searchTerm: string
  onSearchChange: (v: string) => void
  showFilters: boolean
  onToggleFilters: () => void
  filterLifecycle: string
  onFilterLifecycleChange: (v: string) => void
  filterApp: string
  onFilterAppChange: (v: string) => void
  onClearFilters: () => void
  hasActiveFilters: boolean
  applications: AppOption[]
}

export function MicroserviceFilterBar({
  searchTerm,
  onSearchChange,
  showFilters,
  onToggleFilters,
  filterLifecycle,
  onFilterLifecycleChange,
  filterApp,
  onFilterAppChange,
  onClearFilters,
  hasActiveFilters,
  applications,
}: Props) {
  return (
    <div className="bg-card rounded-xl border border-boundary p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
          <input
            type="text"
            placeholder="Buscar microservicios..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <Button
          onClick={onToggleFilters}
          className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
            hasActiveFilters
              ? 'border-primary text-primary bg-primary/5'
              : 'border-neutral-30 dark:border-neutral-60 text-muted hover:bg-neutral-10 dark:hover:bg-neutral-70'
          }`}
        >
          <Filter size={16} /> Filtros
          {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary" />}
        </Button>
      </div>
      {showFilters && (
        <div className="space-y-3 pt-3 border-t border-boundary">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-60">Estado</label>
              <Select
                value={filterLifecycle}
                onChange={onFilterLifecycleChange}
                options={[
                  { value: '', label: 'Todos' },
                  ...Object.entries(lifecycleLabel).map(([k, v]) => ({ value: k, label: v })),
                ]}
                className="min-w-[140px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-60">Aplicación</label>
              <Select
                value={filterApp}
                onChange={onFilterAppChange}
                options={[
                  { value: '', label: 'Todas' },
                  ...applications.map((app) => ({ value: app.id, label: app.name })),
                ]}
                className="min-w-[160px]"
              />
            </div>
            {hasActiveFilters && (
              <Button
                onClick={onClearFilters}
                className="flex items-center gap-1 px-2 py-1.5 text-xs text-danger hover:text-danger-dark transition-colors"
              >
                <X size={14} /> Limpiar filtros
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
