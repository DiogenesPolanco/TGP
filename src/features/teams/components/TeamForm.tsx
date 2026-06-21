import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { X, Trash2 } from 'lucide-react'
import { useConfirm } from '@/hooks/useConfirm'
import { PersonSelect } from '@/components/ui/PersonSelect'
import { Select } from '@/components/ui/Select'
import { MEMBER_ROLES, MEMBER_ROLE_LABELS } from '@/constants/roleLabels'
import type { Team, TeamMember, TeamMetrics } from '@/types/domain'
import type { MemberRole } from '@/constants/enums'
import { Button } from '@/components/ui/Button'

interface TeamFormProps {
  team: Team | null
  onClose: () => void
  onSave: () => void
}

export function TeamForm({ team, onClose, onSave }: TeamFormProps) {
  const { confirm } = useConfirm()
  const businessUnits = useLiveQuery(() => db.businessUnits.toArray()) ?? []
  const teams = useLiveQuery(() => db.teams.toArray()) ?? []
  const users = useLiveQuery(() => db.users.toArray()) ?? []

  const resolveDisplayName = (personId: string): string => {
    for (const t of teams) {
      const m = t.members.find((m) => m.id === personId)
      if (m) return m.displayName
    }
    const u = users.find((u) => u.id === personId)
    if (u) return u.displayName
    return personId
  }

  const resolveUserPrincipal = (personId: string): string => {
    const name = resolveDisplayName(personId)
    return name.toLowerCase().replace(/\s+/g, '.')
  }
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
      for (const m of formData.members) {
        const profile = await db.memberProfiles.get(m.id)
        if (profile && profile.role !== m.role) {
          await db.memberProfiles.put({ ...profile, role: m.role as MemberRole, updatedAt: new Date() })
        }
      }
    } else {
      await db.teams.add({ ...data, id: crypto.randomUUID() })
    }
    onSave()
  }

  const addMember = () => {
    const newMember: TeamMember = {
      id: '',
      userPrincipal: '',
      displayName: '',
      role: 'developer',
      allocationPct: 100,
      status: 'activo',
    }
    setFormData({ ...formData, members: [...formData.members, newMember] })
  }

  const handlePersonChange = (index: number, personId: string) => {
    const updated = [...formData.members]
    updated[index] = {
      ...updated[index],
      id: personId,
      userPrincipal: resolveUserPrincipal(personId),
      displayName: resolveDisplayName(personId),
    }
    setFormData({ ...formData, members: updated })
  }

  const updateMember = (index: number, field: keyof TeamMember, value: string | number | boolean) => {
    const updated = [...formData.members]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, members: updated })
  }

  const removeMember = async (index: number) => {
    if (!(await confirm('¿Eliminar este miembro?'))) return
    setFormData({ ...formData, members: formData.members.filter((_, i) => i !== index) })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl border border-boundary shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-boundary">
          <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">
            {team ? 'Editar Equipo' : 'Nuevo Equipo'}
          </h3>
          <Button onClick={onClose} className="p-1 rounded-md hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">
            <X size={20} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Nombre *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <Select label="Business Unit *" required value={formData.businessUnitId} onChange={(v) => setFormData({ ...formData, businessUnitId: v })} options={[
                { value: '', label: 'Seleccionar...' },
                ...businessUnits.map((bu) => ({ value: bu.id, label: bu.name })),
              ]} />
            </div>
          </div>

          <div>
            <Select label="Sistema Fuente" value={formData.sourceSystem} onChange={(v) => setFormData({ ...formData, sourceSystem: v as typeof formData.sourceSystem })} options={[
              { value: 'manual', label: 'Manual' },
              { value: 'jira', label: 'Jira' },
              { value: 'azure_devops', label: 'Azure DevOps' },
              { value: 'github', label: 'GitHub' },
              { value: 'gitlab', label: 'GitLab' },
            ]} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-secondary">Miembros</label>
              <Button
                type="button"
                onClick={addMember}
                className="text-sm text-primary hover:underline"
              >
                + Agregar miembro
              </Button>
            </div>
            <div className="space-y-2">
              {formData.members.map((member, index) => (
                <div key={member.id || index} className="flex items-center gap-2 p-2 bg-neutral-10 dark:bg-neutral-70 rounded-lg">
                  <div className="flex-1 min-w-[180px]">
                    <PersonSelect
                      value={member.id}
                      onChange={(personId) => handlePersonChange(index, personId)}
                      placeholder="Buscar persona..."
                    />
                  </div>
                  <select
                    value={member.role}
                    onChange={(e) => updateMember(index, 'role', e.target.value)}
                    className="w-28 px-2 py-1 rounded border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm"
                  >
                    {MEMBER_ROLES.map((r) => (<option key={r} value={r}>{MEMBER_ROLE_LABELS[r]}</option>))}
                  </select>
                  <input
                    type="number"
                    placeholder="%"
                    value={member.allocationPct}
                    onChange={(e) => updateMember(index, 'allocationPct', parseInt(e.target.value))}
                    className="w-16 px-2 py-1 rounded border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm"
                  />
                  <Button
                    type="button"
                    onClick={() => removeMember(index)}
                    className="p-1 rounded text-neutral-50 hover:text-danger hover:bg-danger/10 transition-colors"
                    title="Eliminar miembro"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-secondary mb-2 block">Métricas DORA</label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-muted mb-1">Velocity</label>
                <input
                  type="number"
                  value={formData.metrics.velocity}
                  onChange={(e) => setFormData({ ...formData, metrics: { ...formData.metrics, velocity: parseFloat(e.target.value) } })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Lead Time (h)</label>
                <input
                  type="number"
                  value={formData.metrics.leadTimeHours}
                  onChange={(e) => setFormData({ ...formData, metrics: { ...formData.metrics, leadTimeHours: parseFloat(e.target.value) } })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Cycle Time (h)</label>
                <input
                  type="number"
                  value={formData.metrics.cycleTimeHours}
                  onChange={(e) => setFormData({ ...formData, metrics: { ...formData.metrics, cycleTimeHours: parseFloat(e.target.value) } })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Throughput</label>
                <input
                  type="number"
                  value={formData.metrics.throughput}
                  onChange={(e) => setFormData({ ...formData, metrics: { ...formData.metrics, throughput: parseInt(e.target.value) } })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Deploy Freq</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.metrics.deploymentFrequency}
                  onChange={(e) => setFormData({ ...formData, metrics: { ...formData.metrics, deploymentFrequency: parseFloat(e.target.value) } })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">CFR (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.metrics.changeFailureRate}
                  onChange={(e) => setFormData({ ...formData, metrics: { ...formData.metrics, changeFailureRate: parseFloat(e.target.value) } })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">MTTR (h)</label>
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
            <Button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-secondary hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors"
            >
              {team ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
