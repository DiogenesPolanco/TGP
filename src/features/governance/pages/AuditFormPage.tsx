import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { ArrowLeft } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import { DatePicker } from '@/components/ui/DatePicker'
import { Select } from '@/components/ui/Select'
import type { Severity, AuditStatus, AuditCategory } from '@/types/domain'
import { Button } from '@/components/ui/Button'
import { parseLocalDate } from '@/lib/utils'

const CATEGORY_OPTIONS: { value: AuditCategory; label: string }[] = [
  { value: 'compliance', label: 'Cumplimiento' },
  { value: 'security', label: 'Seguridad' },
  { value: 'architecture', label: 'Arquitectura' },
  { value: 'process', label: 'Proceso' },
  { value: 'data_governance', label: 'Data Governance' },
  { value: 'access_control', label: 'Control de Acceso' },
  { value: 'business_continuity', label: 'Continuidad' },
]

export function AuditFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addNotification } = useAppStore()
  const finding = useLiveQuery(() => (id ? db.auditFindings.get(id) : undefined), [id])
  const applications = useLiveQuery(() => db.applications.toArray()) ?? []

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'medium' as Severity,
    category: 'compliance' as AuditCategory,
    status: 'open' as AuditStatus,
    dueDate: '',
    actionPlan: '',
    applicationId: '',
  })

  useEffect(() => {
    if (finding) {
      queueMicrotask(() => {
        setFormData({
          title: finding.title ?? '',
          description: finding.description ?? '',
          severity: finding.severity ?? 'medium',
          category: finding.category ?? 'compliance',
          status: finding.status ?? 'open',
          dueDate: finding.dueDate ? new Date(finding.dueDate).toISOString().split('T')[0] : '',
          actionPlan: (finding.metadata?.actionPlanNotes as string) ?? '',
          applicationId: finding.applicationId ?? '',
        })
      })
    }
  }, [finding])

  if (id && !finding) return <div className="p-6 text-neutral-50">Cargando...</div>

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const hasDueDate = formData.dueDate ? parseLocalDate(formData.dueDate) : undefined
    const baseData = {
      ...formData,
      actionPlan: null,
      applicationId: formData.applicationId || null,
      auditReference: finding?.auditReference ?? `AUD-${crypto.randomUUID().slice(0, 8)}`,
      evidence: finding?.evidence ?? [],
      metadata: { ...finding?.metadata, actionPlanNotes: formData.actionPlan || undefined },
      createdAt: finding?.createdAt ?? new Date(),
      updatedAt: new Date(),
    }
    if (finding) {
      await db.auditFindings.update(finding.id, { ...baseData, dueDate: hasDueDate })
      addNotification({ type: 'success', message: 'Hallazgo actualizado' })
    } else {
      await db.auditFindings.add({
        ...baseData,
        id: crypto.randomUUID(),
        dueDate: hasDueDate ?? new Date(),
      })
      addNotification({ type: 'success', message: 'Hallazgo creado' })
    }
    navigate('/governance/audit')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          onClick={() => navigate('/governance/audit')}
          className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
        >
          <ArrowLeft size={20} className="text-neutral-60" />
        </Button>
        <h1 className="text-2xl font-bold text-neutral-90 dark:text-white">
          {finding ? 'Editar Hallazgo' : 'Nuevo Hallazgo'}
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-xl border border-boundary p-6 shadow-sm space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Título *</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Descripción</label>
          <RichTextEditor
            value={formData.description}
            onChange={(html) => setFormData({ ...formData, description: html })}
            placeholder="Describe el hallazgo..."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Select
              label="Categoría *"
              required
              value={formData.category}
              onChange={(v) => setFormData({ ...formData, category: v as AuditCategory })}
              options={CATEGORY_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
            />
          </div>
          <div>
            <Select
              label="Severidad *"
              required
              value={formData.severity}
              onChange={(v) => setFormData({ ...formData, severity: v as Severity })}
              options={[
                { value: 'critical', label: 'Crítica' },
                { value: 'high', label: 'Alta' },
                { value: 'medium', label: 'Media' },
                { value: 'low', label: 'Baja' },
              ]}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Select
              label="Estado *"
              required
              value={formData.status}
              onChange={(v) => setFormData({ ...formData, status: v as AuditStatus })}
              options={[
                { value: 'open', label: 'Abierto' },
                { value: 'in_progress', label: 'En progreso' },
                { value: 'overdue', label: 'Vencido' },
                { value: 'resolved', label: 'Resuelto' },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Fecha límite</label>
            <DatePicker
              value={formData.dueDate}
              onChange={(v) => setFormData({ ...formData, dueDate: v })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
        <div>
          <Select
            label="Aplicación"
            value={formData.applicationId}
            onChange={(v) => setFormData({ ...formData, applicationId: v })}
            options={[
              { value: '', label: 'Sin aplicación' },
              ...applications.map((app) => ({ value: app.id, label: app.name })),
            ]}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Plan de Acción</label>
          <RichTextEditor
            value={formData.actionPlan}
            onChange={(html) => setFormData({ ...formData, actionPlan: html })}
            placeholder="Plan de acción..."
          />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            onClick={() => navigate('/governance/audit')}
            className="px-4 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-secondary hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors"
          >
            {finding ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </form>
    </div>
  )
}
