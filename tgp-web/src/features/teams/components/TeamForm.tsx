import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { X } from 'lucide-react'
import type { Team, TeamMember, TeamMetrics } from '@/types/domain'

interface TeamFormProps {
  team: Team | null
  onClose: () => void
  onSave: () => void
}

export function TeamForm({ team, onClose, onSave }: TeamFormProps) {
  const businessUnits = useLiveQuery(() => db.businessUnits.toArray()) ?? []
  const [formData, setFormData] = useState({
    name: team?.name ?? '',
    businessUnitId: team?.businessUnitId ?? '',
    sourceSystem: team?.sourceSystem ?? 'manual',
    members: team?.members ?? [] as TeamMember[],
    metrics: team?.currentMetrics ?? {
      velocity: 0,
      leadTimeHours: 0,
      cycleTimeHours: 0,
      throughput: 0,
      deploymentFrequency: 0,
      changeFailureRate: 0,
      mttrHours: 0,
      measuredAt: new Date(),
    } as TeamMetrics,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      ...formData,
      externalId: team?.externalId ?? `TEAM-${Date.now()}`,
      currentMetrics: formData.metrics,
      metadata: team?.metadata ?? {},
      createdAt: team?.createdAt ?? new Date(),
      updatedAt: new Date(),
    }

    if (team) {
      await db.teams.update(team.id, data)
    } else {
      await db.teams.add({ ...data, id: crypto.randomUUID() })
    }
    onSave()
  }

  const addMember = () => {
    const newMember: TeamMember = {
      id: crypto.randomUUID(),
      userPrincipal: '',
      displayName: '',
      role: 'Developer',
      allocationPct: 100,
      isActive: true,
    }
    setFormData({ ...formData, members: [...formData.members, newMember] })
  }

  const updateMember = (index: number, field: keyof TeamMember, value: string | number | boolean) => {
    const updated = [...formData.members]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, members: updated })
  }

  const removeMember = (index: number) => {
    setFormData({ ...formData, members: formData.members.filter((_, i) => i !== index) })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-20 dark:border-neutral-70">
          <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">
            {team ? 'Editar Equipo' : 'Nuevo Equipo'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Nombre *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Business Unit *</label>
              <select
                required
                value={formData.businessUnitId}
                onChange={(e) => setFormData({ ...formData, businessUnitId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Seleccionar...</option>
                {businessUnits.map((bu) => (
                  <option key={bu.id} value={bu.id}>{bu.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Sistema Fuente</label>
            <select
              value={formData.sourceSystem}
              onChange={(e) => setFormData({ ...formData, sourceSystem: e.target.value as typeof formData.sourceSystem })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="manual">Manual</option>
              <option value="jira">Jira</option>
              <option value="azure_devops">Azure DevOps</option>
              <option value="github">GitHub</option>
              <option value="gitlab">GitLab</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-neutral-70 dark:text-neutral-30">Miembros</label>
              <button
                type="button"
                onClick={addMember}
                className="text-sm text-primary hover:underline"
              >
                + Agregar miembro
              </button>
            </div>
            <div className="space-y-2">
              {formData.members.map((member, index) => (
                <div key={member.id} className="flex items-center gap-2 p-2 bg-neutral-10 dark:bg-neutral-70 rounded-lg">
                  <input
                    type="text"
                    placeholder="Nombre"
                    value={member.displayName}
                    onChange={(e) => updateMember(index, 'displayName', e.target.value)}
                    className="flex-1 px-2 py-1 rounded border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Rol"
                    value={member.role}
                    onChange={(e) => updateMember(index, 'role', e.target.value)}
                    className="w-24 px-2 py-1 rounded border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm"
                  />
                  <input
                    type="number"
                    placeholder="%"
                    value={member.allocationPct}
                    onChange={(e) => updateMember(index, 'allocationPct', parseInt(e.target.value))}
                    className="w-16 px-2 py-1 rounded border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeMember(index)}
                    className="text-sm text-danger hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-2 block">Métricas DORA</label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-neutral-60 dark:text-neutral-40 mb-1">Velocity</label>
                <input
                  type="number"
                  value={formData.metrics.velocity}
                  onChange={(e) => setFormData({ ...formData, metrics: { ...formData.metrics, velocity: parseFloat(e.target.value) } })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-60 dark:text-neutral-40 mb-1">Lead Time (h)</label>
                <input
                  type="number"
                  value={formData.metrics.leadTimeHours}
                  onChange={(e) => setFormData({ ...formData, metrics: { ...formData.metrics, leadTimeHours: parseFloat(e.target.value) } })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-60 dark:text-neutral-40 mb-1">Cycle Time (h)</label>
                <input
                  type="number"
                  value={formData.metrics.cycleTimeHours}
                  onChange={(e) => setFormData({ ...formData, metrics: { ...formData.metrics, cycleTimeHours: parseFloat(e.target.value) } })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-60 dark:text-neutral-40 mb-1">Throughput</label>
                <input
                  type="number"
                  value={formData.metrics.throughput}
                  onChange={(e) => setFormData({ ...formData, metrics: { ...formData.metrics, throughput: parseInt(e.target.value) } })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-60 dark:text-neutral-40 mb-1">Deploy Freq</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.metrics.deploymentFrequency}
                  onChange={(e) => setFormData({ ...formData, metrics: { ...formData.metrics, deploymentFrequency: parseFloat(e.target.value) } })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-60 dark:text-neutral-40 mb-1">CFR (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.metrics.changeFailureRate}
                  onChange={(e) => setFormData({ ...formData, metrics: { ...formData.metrics, changeFailureRate: parseFloat(e.target.value) } })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-60 dark:text-neutral-40 mb-1">MTTR (h)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.metrics.mttrHours}
                  onChange={(e) => setFormData({ ...formData, metrics: { ...formData.metrics, mttrHours: parseFloat(e.target.value) } })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-70 dark:text-neutral-30 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors"
            >
              {team ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
