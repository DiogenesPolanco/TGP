import { TechSearch } from '@/components/ui/TechSearch'
import { MemberSelector } from '@/components/ui/MemberSelector'
import { Select } from '@/components/ui/Select'
import { GitBranch } from 'lucide-react'
import type { MicroserviceLifecycleStatus, ServiceLevel } from '@/types/domain'

interface Props {
  name: string
  setName: (v: string) => void
  description: string
  setDescription: (v: string) => void
  techIds: string[]
  setTechIds: (v: string[]) => void
  repository: string
  setRepository: (v: string) => void
  serviceLevel: string
  setServiceLevel: (v: ServiceLevel) => void
  technicalLead: string
  setTechnicalLead: (v: string) => void
  lifecycleStatus: MicroserviceLifecycleStatus
  setLifecycleStatus: (v: MicroserviceLifecycleStatus) => void
  decommissionPlan: string
  setDecommissionPlan: (v: string) => void
  markDirty: () => void
  isNew: boolean
}

export function MicroserviceInfoSection(props: Props) {
  const {
    name, setName, description, setDescription, techIds, setTechIds,
    repository, setRepository, serviceLevel, setServiceLevel,
    technicalLead, setTechnicalLead, lifecycleStatus, setLifecycleStatus,
    decommissionPlan, setDecommissionPlan, markDirty, isNew,
  } = props

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-neutral-90 dark:text-white">
        Información General
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <fieldset>
          <legend className="block text-xs font-medium text-neutral-50 mb-1">
            Nombre <span className="text-danger">*</span>
          </legend>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); markDirty() }}
            placeholder="ej. auth-service"
            className="w-full px-3 py-1.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </fieldset>
        <fieldset>
          <legend className="block text-xs font-medium text-neutral-50 mb-1">
            Repositorio
          </legend>
          <div className="relative">
            <GitBranch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
            <input
              type="text"
              value={repository}
              onChange={(e) => { setRepository(e.target.value); markDirty() }}
              placeholder="ej. org/auth-service"
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </fieldset>
        <fieldset>
          <legend className="block text-xs font-medium text-neutral-50 mb-1">
            Nivel de Servicio
          </legend>
          <Select
            value={serviceLevel}
            onChange={(v) => { setServiceLevel(v as ServiceLevel); markDirty() }}
            options={[
              { value: 'critical', label: 'Crítico' },
              { value: 'high', label: 'Alto' },
              { value: 'medium', label: 'Medio' },
              { value: 'low', label: 'Bajo' },
            ]}
          />
        </fieldset>
        <fieldset>
          <legend className="block text-xs font-medium text-neutral-50 mb-1">
            Tech Lead
          </legend>
          <MemberSelector
            value={technicalLead}
            onChange={(v) => { setTechnicalLead(v); markDirty() }}
          />
        </fieldset>
      </div>

      <fieldset>
        <legend className="block text-xs font-medium text-neutral-50 mb-1">Descripción</legend>
        <textarea
          value={description}
          onChange={(e) => { setDescription(e.target.value); markDirty() }}
          placeholder="Descripción del microservicio"
          rows={3}
          className="w-full px-3 py-1.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
        />
      </fieldset>

      <fieldset>
        <legend className="block text-xs font-medium text-neutral-50 mb-1">Tech Stack</legend>
        <TechSearch
          selectedIds={techIds}
          onChange={(ids) => { setTechIds(ids); markDirty() }}
          enableDepsSearch
        />
      </fieldset>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <fieldset>
          <legend className="block text-xs font-medium text-neutral-50 mb-1">
            Ciclo de Vida
          </legend>
          <Select
            value={lifecycleStatus}
            onChange={(v) => { setLifecycleStatus(v as MicroserviceLifecycleStatus); markDirty() }}
            options={[
              { value: 'active', label: 'Activo' },
              { value: 'evolving', label: 'En Evolución' },
              { value: 'deprecated', label: 'Deprecado' },
              { value: 'decommissioned', label: 'Decomisionado' },
              { value: 'planned', label: 'Planificado' },
            ]}
          />
        </fieldset>
        {lifecycleStatus === 'decommissioned' && (
          <fieldset>
            <legend className="block text-xs font-medium text-neutral-50 mb-1">
              Plan de Decomiso
            </legend>
            <textarea
              value={decommissionPlan}
              onChange={(e) => { setDecommissionPlan(e.target.value); markDirty() }}
              placeholder="Detalla el plan para decomisar este microservicio..."
              rows={3}
              className="w-full px-3 py-1.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </fieldset>
        )}
      </div>
    </div>
  )
}
