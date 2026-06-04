import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { ArrowLeft } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import type { RiskStatus, RiskCategory } from '@/types/domain'

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
      setFormData({
        title: risk.title ?? '',
        description: risk.description ?? '',
        probability: risk.probability ?? 1,
        impact: risk.impact ?? 1,
        status: risk.status ?? 'open',
        mitigationPlan: risk.mitigationPlan ?? '',
        applicationId: risk.applicationId ?? '',
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
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/governance/risks')} className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"><ArrowLeft size={20} className="text-neutral-60" /></button>
        <h1 className="text-2xl font-bold text-neutral-90 dark:text-white">{risk ? 'Editar Riesgo' : 'Nuevo Riesgo'}</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm space-y-4">
        <div><label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Título *</label><input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
        <div><label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Descripción</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Probabilidad *</label>
            <select required value={formData.probability} onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value={1}>Muy Baja (1)</option><option value={2}>Baja (2)</option><option value={3}>Media (3)</option><option value={4}>Alta (4)</option><option value={5}>Muy Alta (5)</option>
            </select></div>
          <div><label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Impacto *</label>
            <select required value={formData.impact} onChange={(e) => setFormData({ ...formData, impact: parseInt(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value={1}>Muy Bajo (1)</option><option value={2}>Bajo (2)</option><option value={3}>Medio (3)</option><option value={4}>Alto (4)</option><option value={5}>Muy Alto (5)</option>
            </select></div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-neutral-10 dark:bg-neutral-70 rounded-lg">
          <span className="text-sm text-neutral-70 dark:text-neutral-30">Score de Riesgo:</span>
          <span className={`text-lg font-bold ${severityColor}`}>{riskScore}</span>
          <span className="text-xs text-neutral-50">(Probabilidad × Impacto)</span>
        </div>
        <div><label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Estado *</label>
          <select required value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as RiskStatus })} className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="open">Abierto</option><option value="mitigated">Mitigado</option><option value="accepted">Aceptado</option><option value="closed">Cerrado</option>
          </select></div>
        <div><label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Plan de Mitigación</label><textarea value={formData.mitigationPlan} onChange={(e) => setFormData({ ...formData, mitigationPlan: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
        <div><label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Aplicación</label>
          <select value={formData.applicationId} onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">Sin aplicación</option>
            {applications.map((app) => (<option key={app.id} value={app.id}>{app.name}</option>))}
          </select></div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={() => navigate('/governance/risks')} className="px-4 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-70 dark:text-neutral-30 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors">{risk ? 'Actualizar' : 'Crear'}</button>
        </div>
      </form>
    </div>
  )
}
