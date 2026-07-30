import { useState } from 'react'
import { Search, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { StatusFilter } from '../utils/mapHelpers'
import { STATUS_FILTER_OPTIONS } from '../utils/mapHelpers'

interface Props {
  search: string
  onSearchChange: (v: string) => void
  statusFilter: StatusFilter
  onStatusFilterChange: (v: StatusFilter) => void
  showMicroservices: boolean
  onToggleMicroservices: () => void
  filteredApps: number
  filteredMs: number
}

export function ObsolescenceMapSidebar({
  search, onSearchChange, statusFilter, onStatusFilterChange,
  showMicroservices, onToggleMicroservices, filteredApps, filteredMs,
}: Props) {
  const hasFilters = search || statusFilter !== 'all' || !showMicroservices

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="bg-card rounded-xl border border-boundary p-4">
        <h3 className="font-semibold text-sm text-neutral-90 dark:text-white mb-3">Leyenda</h3>
        <div className="space-y-2.5">
          <LegendItem color="#FF5630" label="EOL — Fin de vida" />
          <LegendItem color="#FF8B00" label="Soporte Extendido" />
          <LegendItem color="#8B5CF6" label="Mixto (activo + extendido)" />
          <LegendItem color="#36B37E" label="Activo — Saludable" />
          <LegendItem color="#6B778C" label="Sin datos / Desconocido" />
        </div>

        <div className="mt-4 pt-3 border-t border-boundary">
          <h4 className="text-xs font-semibold text-neutral-70 dark:text-neutral-40 uppercase tracking-wider mb-2">Nodos</h4>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-5 h-5 rounded-full border-2 border-neutral-50 flex items-center justify-center" />
            <span className="text-xs text-secondary">App</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full border-2 border-neutral-50 flex items-center justify-center" />
            <span className="text-xs text-secondary">Microservicio</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-boundary">
          <h4 className="text-xs font-semibold text-neutral-70 dark:text-neutral-40 uppercase tracking-wider mb-2">Interacción</h4>
          <p className="text-xs text-neutral-60 leading-relaxed">
            Click en un nodo para ir al detalle de la aplicación. Las flechas punteadas indican relación app → microservicio.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-boundary p-4">
        <h3 className="font-semibold text-sm text-neutral-90 dark:text-white mb-3">Filtros</h3>

        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
          <input type="text" placeholder="Buscar por nombre..." value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        <div className="mb-3">
          <label className="text-xs font-medium text-muted mb-1.5 block">Estado de soporte</label>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => onStatusFilterChange(opt.value)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                  statusFilter === opt.value ? 'border-current bg-current/10' : 'border-neutral-30 dark:border-neutral-60 text-muted hover:bg-neutral-10 dark:hover:bg-neutral-70'
                }`}
                style={statusFilter === opt.value ? { borderColor: opt.color, color: opt.color } : undefined}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-boundary">
          <div className="flex items-center gap-2">
            {showMicroservices ? <Eye size={15} className="text-primary" /> : <EyeOff size={15} className="text-neutral-50" />}
            <span className="text-xs text-secondary">Microservicios</span>
          </div>
          <button onClick={onToggleMicroservices}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${showMicroservices ? 'bg-primary' : 'bg-neutral-40'}`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${showMicroservices ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {hasFilters && (
          <button onClick={() => { onSearchChange(''); onStatusFilterChange('all'); if (!showMicroservices) onToggleMicroservices() }}
            className="mt-3 w-full text-xs text-center text-primary hover:text-primary-dark py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Summary */}
      {statusFilter !== 'all' && (
        <div className="bg-card rounded-xl border border-boundary p-4">
          <h3 className="font-semibold text-sm text-neutral-90 dark:text-white mb-2">Resultados</h3>
          <p className="text-xs text-neutral-60">
            {filteredApps} apps · {filteredMs} microservicios
          </p>
        </div>
      )}
    </div>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-xs text-secondary">{label}</span>
    </div>
  )
}
