import { Search, Filter, X } from 'lucide-react'
import { Select } from '@/components/ui/Select'
import { useCatalog } from '@/hooks/useCatalog'
import { Button } from '@/components/ui/Button'

interface TeamOption {
  id: string
  name: string
}

interface Props {
  searchTerm: string
  onSearchChange: (v: string) => void
  showFilters: boolean
  onToggleFilters: () => void
  filterTeam: string
  onFilterTeamChange: (v: string) => void
  filterStatus: string
  onFilterStatusChange: (v: string) => void
  teamOptions: TeamOption[]
  onClearFilters: () => void
  hasActiveFilters: boolean
}

export function MembersFilterBar({
  searchTerm,
  onSearchChange,
  showFilters,
  onToggleFilters,
  filterTeam,
  onFilterTeamChange,
  filterStatus,
  onFilterStatusChange,
  teamOptions,
  onClearFilters,
  hasActiveFilters,
}: Props) {
  const memberStatuses = useCatalog('member_status')
  return (
    <div className="bg-card rounded-xl border border-boundary p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
          <input
            type="text"
            placeholder="Buscar miembros..."
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
          <Filter size={16} />
          Filtros
          {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary" />}
        </Button>
      </div>

      {showFilters && (
        <div className="flex items-center gap-4 pt-3 border-t border-boundary">
          <div>
            <label className="text-xs text-neutral-60 mr-2">Equipo</label>
            <Select
              value={filterTeam}
              onChange={onFilterTeamChange}
              options={[
                { value: '', label: 'Todos' },
                ...teamOptions.map((t) => ({ value: t.id, label: t.name })),
              ]}
              className="min-w-[140px]"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-60 mr-2">Estado</label>
            <Select
              value={filterStatus}
              onChange={onFilterStatusChange}
              options={[
                { value: '', label: 'Todos' },
                ...memberStatuses.map((s) => ({ value: s.value, label: s.label })),
              ]}
              className="min-w-[140px]"
            />
          </div>
          {hasActiveFilters && (
            <Button
              onClick={onClearFilters}
              className="flex items-center gap-1 px-2 py-1.5 text-xs text-danger"
            >
              <X size={14} />
              Limpiar
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
