import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { ArrowLeft } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import { Select } from '@/components/ui/Select'
import type { RiskStatus, RiskCategory } from '@/types/domain'
import { Button } from '@/components/ui/Button'

export function RiskFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addNotification } = useAppStore()
  const risk = useLiveQuery(() => (id ? db.risks.get(id) : undefined), [id])
  const applications = useLiveQuery(() => db.applications.toArray()) ?? []

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    probability: 1,
    impact: 1,
    status: 'open' as RiskStatus,
    mitigationPlan: '',
    applicationId: '',
  })

  useEffect(() => {
    if (risk) {
      queueMicrotask(() => {
        setFormData({
          title: risk.title ?? '',
          description: risk.description ?? '',
          probability: risk.probability ?? 1,
          impact: risk.impact ?? 1,
          status: risk.status ?? 'open',
          mitigationPlan: risk.mitigationPlan ?? '',
          applicationId: risk.applicationId ?? '',
        })
      })
    }
  }, [risk])

  if (id && !risk) return <div className="p-6 text-neutral-50">Cargando...</div>

  const riskScore = formData.probability * formData.impact

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = { ...formData, probability: Number(formData.probability), impact: Number(formData.impact), riskScore, applicationId: formData.applicationId || null, businessUnitId: risk?.businessUnitId ?? '', category: (risk?.category ?? 'technical') as RiskCategory, targetDate: risk?.targetDate ?? null, metadata: risk?.metadata ?? {}, createdAt: risk?.createdAt ?? new Date(), updatedAt: new Date() }
    if (risk) { await db.risks.update(risk.id, data); addNotification({ type: 'success', message: 'Riesgo actualizado' }) }
    else { await db.risks.add({ ...data, id: crypto.randomUUID() }); addNotification({ type: 'success', message: 'Riesgo creado' }) }
    navigate('/governance/risks')
  }

  const severityColor = riskScore >= 15 ? 'text-danger' : riskScore >= 8 ? 'text-warning' : 'text-neutral-60'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button onClick={() => navigate('/governance/risks')} className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"><ArrowLeft size={20} className="text-neutral-60" /></Button>
        <h1 className="text-2xl font-bold text-neutral-90 dark:text-white">{risk ? 'Editar Riesgo' : 'Nuevo Riesgo'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-boundary p-6 shadow-sm space-y-4">
        <div><label className="block text-sm font-medium text-secondary mb-1">Título *</label><input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
        <div><label className="block text-sm font-medium text-secondary mb-1">Descripción</label><RichTextEditor value={formData.description} onChange={(html) => setFormData({ ...formData, description: html })} placeholder="Describe el riesgo..." /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><Select label="Probabilidad *" required value={String(formData.probability)} onChange={(v) => setFormData({ ...formData, probability: parseInt(v) })} options={[
            { value: '1', label: 'Muy Baja (1)' },
            { value: '2', label: 'Baja (2)' },
            { value: '3', label: 'Media (3)' },
            { value: '4', label: 'Alta (4)' },
            { value: '5', label: 'Muy Alta (5)' },
          ]} /></div>
          <div><Select label="Impacto *" required value={String(formData.impact)} onChange={(v) => setFormData({ ...formData, impact: parseInt(v) })} options={[
            { value: '1', label: 'Muy Bajo (1)' },
            { value: '2', label: 'Bajo (2)' },
            { value: '3', label: 'Medio (3)' },
            { value: '4', label: 'Alto (4)' },
            { value: '5', label: 'Muy Alto (5)' },
          ]} /></div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-neutral-10 dark:bg-neutral-70 rounded-lg">
          <span className="text-sm text-secondary">Score de Riesgo:</span>
          <span className={`text-lg font-bold ${severityColor}`}>{riskScore}</span>
          <span className="text-xs text-neutral-50">(Probabilidad × Impacto)</span>
        </div>
        <div><Select label="Estado *" required value={formData.status} onChange={(v) => setFormData({ ...formData, status: v as RiskStatus })} options={[
          { value: 'open', label: 'Abierto' },
          { value: 'mitigated', label: 'Mitigado' },
          { value: 'accepted', label: 'Aceptado' },
          { value: 'closed', label: 'Cerrado' },
        ]} /></div>
        <div><label className="block text-sm font-medium text-secondary mb-1">Plan de Mitigación</label><RichTextEditor value={formData.mitigationPlan} onChange={(html) => setFormData({ ...formData, mitigationPlan: html })} placeholder="Plan de mitigación..." /></div>
        <div><Select label="Aplicación" value={formData.applicationId} onChange={(v) => setFormData({ ...formData, applicationId: v })} options={[
          { value: '', label: 'Sin aplicación' },
          ...applications.map((app) => ({ value: app.id, label: app.name })),
        ]} /></div>
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" onClick={() => navigate('/governance/risks')} className="px-4 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-secondary hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">Cancelar</Button>
          <Button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors">{risk ? 'Actualizar' : 'Crear'}</Button>
        </div>
      </form>
    </div>
  )
}
