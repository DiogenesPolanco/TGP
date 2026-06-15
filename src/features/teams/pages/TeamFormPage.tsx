import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { useConfirm } from '@/hooks/useConfirm'
import { ArrowLeft, Plus, Users, Trash2 } from 'lucide-react'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import { PersonSelect } from '@/components/ui/PersonSelect'
import { Select } from '@/components/ui/Select'
import { MEMBER_ROLES, MEMBER_ROLE_LABELS } from '@/constants/roleLabels'
import type { DoraLevel, MemberRole } from '@/constants/enums'
import { Button } from '@/components/ui/Button'

interface MemberInput {
  id: string
  role: string
  allocation: number
}

const doraMetricOptions = [
  { key: 'deploymentFrequency', label: 'Frecuencia Despliegue', unit: '/día' },
  { key: 'leadTime', label: 'Lead Time', unit: 'horas' },
  { key: 'cycleTime', label: 'Cycle Time', unit: 'horas' },
  { key: 'throughput', label: 'Throughput', unit: 'tickets/sem' },
  { key: 'changeFailureRate', label: 'Change Failure Rate', unit: '%' },
  { key: 'mttr', label: 'MTTR', unit: 'horas' },
]

export function TeamFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addNotification } = useAppStore()
  const { confirm } = useConfirm()
  const team = useLiveQuery(() => (id ? db.teams.get(id) : undefined), [id])
  const businessUnits = useLiveQuery(() => db.businessUnits.toArray()) ?? []
  const teams = useLiveQuery(() => db.teams.toArray()) ?? []
  const users = useLiveQuery(() => db.users.toArray()) ?? []

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    doraClassification: 'medium' as DoraLevel,
    businessUnitId: '',
    doraMetrics: { deploymentFrequency: 0, leadTime: 0, cycleTime: 0, throughput: 0, changeFailureRate: 0, mttr: 0 } as Record<string, number>,
  })
  const [members, setMembers] = useState<MemberInput[]>([{ id: '', role: 'developer', allocation: 100 }])

  useEffect(() => {
    if (team) {
      queueMicrotask(() => {
        const meta = team.metadata ?? {}
        setFormData({
          name: team.name ?? '',
          description: (meta.description as string) ?? '',
          doraClassification: (meta.doraClassification as DoraLevel) ?? 'medium',
          businessUnitId: team.businessUnitId ?? '',
          doraMetrics: (meta.doraMetrics as Record<string, number>) ?? { deploymentFrequency: 0, leadTime: 0, cycleTime: 0, throughput: 0, changeFailureRate: 0, mttr: 0 },
        })
        setMembers(team.members?.map((m) => ({ id: m.id, role: m.role as MemberRole, allocation: m.allocationPct ?? 100 })) ?? [{ id: '', role: 'developer' as MemberRole, allocation: 100 }])
      })
    }
  }, [team])

  if (id && !team) return <div className="p-6 text-neutral-50">Cargando...</div>

  const updateMetric = (key: string, value: number) => setFormData({ ...formData, doraMetrics: { ...formData.doraMetrics, [key]: value } })

  const addMember = () => setMembers([...members, { id: '', role: 'developer' as MemberRole, allocation: 100 }])

  const updateMember = (index: number, field: keyof MemberInput, value: string | number) => {
    const updated = [...members]; updated[index] = { ...updated[index], [field]: value }; setMembers(updated)
  }

  const removeMember = async (index: number) => {
    if (!(await confirm('¿Eliminar este miembro?'))) return
    setMembers(members.filter((_, i) => i !== index))
  }

  const lookupDisplayName = (personId: string): string => {
    if (personId === '__me__') return 'Yo'
    for (const t of teams) {
      const m = t.members.find((m) => m.id === personId)
      if (m) return m.displayName
    }
    const u = users.find((u) => u.id === personId)
    if (u) return u.displayName
    return personId
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const teamMembers = members.filter((m) => m.id).map((m) => ({
      id: m.id,
      userPrincipal: lookupDisplayName(m.id).toLowerCase().replace(/\s+/g, '.'),
      displayName: lookupDisplayName(m.id),
      role: m.role as MemberRole,
      allocationPct: m.allocation,
      status: 'activo' as const,
    }))
    const metadata = {
      ...(team?.metadata ?? {}),
      description: formData.description,
      doraClassification: formData.doraClassification,
      doraMetrics: formData.doraMetrics,
    }
    const data = {
      name: formData.name,
      members: teamMembers,
      businessUnitId: formData.businessUnitId || '',
      sourceSystem: 'manual' as const,
      externalId: team?.externalId ?? crypto.randomUUID(),
      currentMetrics: team?.currentMetrics ?? null,
      metadata,
      createdAt: team?.createdAt ?? new Date(),
      updatedAt: new Date(),
    }
    if (team) {
      await db.teams.update(team.id, data);
      for (const m of teamMembers) {
        const profile = await db.memberProfiles.get(m.id)
        if (profile && profile.role !== m.role) {
          await db.memberProfiles.put({ ...profile, role: m.role as MemberRole, updatedAt: new Date() })
        }
      }
      addNotification({ type: 'success', message: 'Equipo actualizado' })
    } else {
      await db.teams.add({ ...data, id: crypto.randomUUID() });
      addNotification({ type: 'success', message: 'Equipo creado' })
    }
    navigate('/teams')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button onClick={() => navigate('/teams')} className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"><ArrowLeft size={20} className="text-neutral-60" /></Button>
        <h1 className="text-2xl font-bold text-neutral-90 dark:text-white">{team ? 'Editar Equipo' : 'Nuevo Equipo'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-8 gap-y-5">
          {/* Left column */}
          <div className="space-y-5">
            <div><label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Nombre *</label><input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
            <div><label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Descripción</label><RichTextEditor value={formData.description} onChange={(html) => setFormData({ ...formData, description: html })} placeholder="Describe el equipo..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Select label="Clasificación DORA" value={formData.doraClassification} onChange={(v) => setFormData({ ...formData, doraClassification: v as DoraLevel })} options={[
                { value: 'elite', label: 'Elite' },
                { value: 'high', label: 'Alto' },
                { value: 'medium', label: 'Medio' },
                { value: 'low', label: 'Bajo' },
              ]} /></div>
              <div><Select label="Business Unit" value={formData.businessUnitId} onChange={(v) => setFormData({ ...formData, businessUnitId: v })} options={[
                { value: '', label: 'Sin BU' },
                ...businessUnits.map((bu) => ({ value: bu.id, label: bu.name })),
              ]} /></div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-neutral-70 dark:text-neutral-30 block mb-2">Métricas DORA</label>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {doraMetricOptions.map((metric) => (<div key={metric.key}><label className="block text-xs text-neutral-50 mb-1">{metric.label}</label><div className="flex items-center gap-1"><input type="number" value={(formData.doraMetrics as Record<string, number>)[metric.key]} onChange={(e) => updateMetric(metric.key, parseFloat(e.target.value))} className="w-full px-2 py-1.5 rounded border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm" /><span className="text-xs text-neutral-50 w-14 shrink-0">{metric.unit}</span></div></div>))}
              </div>
            </div>
          </div>
        </div>

        {/* Members — full width below columns */}
        <div className="mt-6 pt-6 border-t border-neutral-20 dark:border-neutral-70">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-neutral-70 dark:text-neutral-30">Miembros</label>
            <Button type="button" onClick={addMember} className="flex items-center gap-1 text-sm text-primary hover:underline"><Plus size={14} /> Agregar</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-20 dark:border-neutral-70">
                  <th className="text-left px-3 py-2 font-medium text-neutral-50 w-8"></th>
                  <th className="text-left px-3 py-2 font-medium text-neutral-50">Nombre</th>
                  <th className="text-left px-3 py-2 font-medium text-neutral-50">Rol</th>
                  <th className="text-right px-3 py-2 font-medium text-neutral-50 w-24">Asignación</th>
                  <th className="w-10 px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {members.map((member, index) => (
                  <tr key={index} className="border-b border-neutral-20/50 dark:border-neutral-70/50 last:border-0">
                    <td className="px-3 py-2.5 text-neutral-50"><Users size={14} /></td>
                    <td className="px-3 py-2.5 min-w-[200px]">
                      <PersonSelect
                        value={member.id}
                        onChange={(personId) => updateMember(index, 'id', personId)}
                        placeholder="Buscar persona..."
                      />
                    </td>
                    <td className="px-3 py-2.5"><select value={member.role} onChange={(e) => updateMember(index, 'role', e.target.value as MemberRole)} className="w-full min-w-28 px-2 py-1 rounded border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm">{MEMBER_ROLES.map((r) => (<option key={r} value={r}>{MEMBER_ROLE_LABELS[r]}</option>))}</select></td>
                    <td className="px-3 py-2.5"><div className="flex items-center justify-end gap-1"><input type="number" min="1" max="100" value={member.allocation} onChange={(e) => updateMember(index, 'allocation', parseInt(e.target.value))} className="w-16 px-2 py-1 rounded border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm text-right" /><span className="text-xs text-neutral-50">%</span></div></td>
                    <td className="px-3 py-2.5"><Button type="button" onClick={() => removeMember(index)} className="p-1 rounded text-neutral-50 hover:text-danger hover:bg-danger/10 transition-colors" title="Eliminar miembro"><Trash2 size={14} /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4">
          <Button type="button" onClick={() => navigate('/teams')} className="px-4 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-70 dark:text-neutral-30 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">Cancelar</Button>
          <Button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors">{team ? 'Actualizar' : 'Crear'}</Button>
        </div>
      </form>
    </div>
  )
}
