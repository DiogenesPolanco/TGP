import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { ArrowLeft, Plus, Users, Trash2 } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { useConfirm } from '@/hooks/useConfirm'
type DoraLevel = 'elite' | 'high' | 'medium' | 'low'

interface MemberInput {
  name: string
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

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    doraClassification: 'medium' as DoraLevel,
    businessUnitId: '',
    doraMetrics: { deploymentFrequency: 0, leadTime: 0, cycleTime: 0, throughput: 0, changeFailureRate: 0, mttr: 0 } as Record<string, number>,
  })
  const [members, setMembers] = useState<MemberInput[]>([{ name: '', role: '', allocation: 100 }])

  useEffect(() => {
    if (team) {
      const meta = team.metadata ?? {}
      setFormData({
        name: team.name ?? '',
        description: (meta.description as string) ?? '',
        doraClassification: (meta.doraClassification as DoraLevel) ?? 'medium',
        businessUnitId: team.businessUnitId ?? '',
        doraMetrics: (meta.doraMetrics as Record<string, number>) ?? { deploymentFrequency: 0, leadTime: 0, cycleTime: 0, throughput: 0, changeFailureRate: 0, mttr: 0 },
      })
      setMembers(team.members?.map((m) => ({ name: m.displayName || m.id, role: m.role, allocation: m.allocationPct ?? 100 })) ?? [{ name: '', role: '', allocation: 100 }])
    }
  }, [team])

  if (id && !team) return <div className="p-6 text-neutral-50">Cargando...</div>

  const updateMetric = (key: string, value: number) => setFormData({ ...formData, doraMetrics: { ...formData.doraMetrics, [key]: value } })

  const addMember = () => setMembers([...members, { name: '', role: '', allocation: 100 }])

  const updateMember = (index: number, field: keyof MemberInput, value: string | number) => {
    const updated = [...members]; updated[index] = { ...updated[index], [field]: value }; setMembers(updated)
  }

  const removeMember = async (index: number) => {
    if (!(await confirm('¿Eliminar este miembro?'))) return
    setMembers(members.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const teamMembers = members.filter((m) => m.name).map((m) => ({
      id: crypto.randomUUID(),
      userPrincipal: m.name.toLowerCase().replace(/\s+/g, '.'),
      displayName: m.name,
      role: m.role,
      allocationPct: m.allocation,
      isActive: true,
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
    if (team) { await db.teams.update(team.id, data); addNotification({ type: 'success', message: 'Equipo actualizado' }) }
    else { await db.teams.add({ ...data, id: crypto.randomUUID() }); addNotification({ type: 'success', message: 'Equipo creado' }) }
    navigate('/teams')
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/teams')} className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"><ArrowLeft size={20} className="text-neutral-60" /></button>
        <h1 className="text-2xl font-bold text-neutral-90 dark:text-white">{team ? 'Editar Equipo' : 'Nuevo Equipo'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm space-y-4">
        <div><label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Nombre *</label><input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
        <div><label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Descripción</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Clasificación DORA</label>
            <select value={formData.doraClassification} onChange={(e) => setFormData({ ...formData, doraClassification: e.target.value as DoraLevel })} className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="elite">Elite</option><option value="high">Alto</option><option value="medium">Medio</option><option value="low">Bajo</option>
            </select></div>
          <div><label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Business Unit</label>
            <select value={formData.businessUnitId} onChange={(e) => setFormData({ ...formData, businessUnitId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">Sin BU</option>
              {businessUnits.map((bu) => (<option key={bu.id} value={bu.id}>{bu.name}</option>))}
            </select></div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-neutral-70 dark:text-neutral-30">Métricas DORA</label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {doraMetricOptions.map((metric) => (<div key={metric.key}><label className="block text-xs text-neutral-50 mb-1">{metric.label}</label><div className="flex items-center gap-1"><input type="number" value={(formData.doraMetrics as any)[metric.key]} onChange={(e) => updateMetric(metric.key, parseFloat(e.target.value))} className="w-full px-2 py-1.5 rounded border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm" /><span className="text-xs text-neutral-50 w-14">{metric.unit}</span></div></div>))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-neutral-70 dark:text-neutral-30">Miembros</label>
            <button type="button" onClick={addMember} className="flex items-center gap-1 text-sm text-primary hover:underline"><Plus size={14} /> Agregar</button>
          </div>
          <div className="space-y-2">
            {members.map((member, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-neutral-10 dark:bg-neutral-70 rounded-lg">
                <Users size={14} className="text-neutral-50" />
                <input type="text" placeholder="Nombre" value={member.name} onChange={(e) => updateMember(index, 'name', e.target.value)} className="flex-1 min-w-0 px-2 py-1 rounded border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm" />
                <input type="text" placeholder="Rol" value={member.role} onChange={(e) => updateMember(index, 'role', e.target.value)} className="w-24 px-2 py-1 rounded border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm" />
                <input type="number" min="1" max="100" value={member.allocation} onChange={(e) => updateMember(index, 'allocation', parseInt(e.target.value))} className="w-16 px-2 py-1 rounded border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm" />
                <button type="button" onClick={() => removeMember(index)} className="p-1 rounded text-neutral-50 hover:text-danger hover:bg-danger/10 transition-colors" title="Eliminar miembro"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={() => navigate('/teams')} className="px-4 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-70 dark:text-neutral-30 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors">{team ? 'Actualizar' : 'Crear'}</button>
        </div>
      </form>
    </div>
  )
}
