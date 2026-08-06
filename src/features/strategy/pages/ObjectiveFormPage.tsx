import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { Plus, ArrowLeft, Target, Crosshair } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { useConfirm } from '@/hooks/useConfirm'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import { DatePicker } from '@/components/ui/DatePicker'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { parseLocalDate } from '@/lib/utils'
import type { Objective, KeyResult, ObjectiveStatus } from '@/types/domain'
import { STATUS_OPTIONS, STATUS_STYLE, STATUS_ICON } from '../constants/objectiveFormConstants'
import { KeyResultCard } from '../components/KeyResultCard'
import { ObjectivePreviewCard } from '../components/ObjectivePreviewCard'

export function ObjectiveFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addNotification } = useAppStore()
  const { confirm } = useConfirm()
  const objective = useLiveQuery(() => (id ? db.objectives.get(id) : undefined), [id])
  const teams = useLiveQuery(() => db.teams.toArray()) ?? []
  const businessUnits = useLiveQuery(() => db.businessUnits.toArray()) ?? []

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'okr' as Objective['type'],
    teamId: '',
    businessUnitId: '',
    periodStart: new Date().toISOString().split('T')[0],
    periodEnd: '',
    status: 'not_started' as ObjectiveStatus,
    keyResults: [] as KeyResult[],
  })

  useEffect(() => {
    if (objective)
      queueMicrotask(() =>
        setFormData({
          title: objective.title ?? '',
          description: objective.description ?? '',
          type: objective.type ?? 'okr',
          teamId: objective.teamId ?? '',
          businessUnitId: objective.businessUnitId ?? '',
          periodStart:
            objective.periodStart && !isNaN(new Date(objective.periodStart).getTime())
              ? new Date(objective.periodStart).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0],
          periodEnd:
            objective.periodEnd && !isNaN(new Date(objective.periodEnd).getTime())
              ? new Date(objective.periodEnd).toISOString().split('T')[0]
              : '',
          status: objective.status ?? 'not_started',
          keyResults: objective.keyResults ?? [],
        }),
      )
  }, [objective])

  const liveProgress = useMemo(() => {
    if (formData.keyResults.length === 0) return 0
    return Math.min(
      100,
      formData.keyResults.reduce((sum, kr) => {
        if (kr.target <= kr.baseline) return sum
        return sum + Math.round(((kr.current - kr.baseline) / (kr.target - kr.baseline)) * 100)
      }, 0) / formData.keyResults.length,
    )
  }, [formData.keyResults])

  if (id && !objective) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-neutral-50">
          <div className="w-5 h-5 rounded-full border-2 border-neutral-30 border-t-primary animate-spin" />
          Cargando...
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      ...formData,
      teamId: formData.teamId || null,
      businessUnitId: formData.businessUnitId || null,
      periodStart: parseLocalDate(formData.periodStart),
      periodEnd: parseLocalDate(formData.periodEnd),
      progress: liveProgress,
      metadata: objective?.metadata ?? {},
      createdAt: objective?.createdAt ?? new Date(),
      updatedAt: new Date(),
    }
    if (objective) {
      await db.objectives.update(objective.id, data)
      addNotification({ type: 'success', message: 'Objetivo actualizado' })
    } else {
      await db.objectives.add({ ...data, id: crypto.randomUUID() })
      addNotification({ type: 'success', message: 'Objetivo creado' })
    }
    navigate('/strategy/objectives')
  }

  const addKeyResult = () => {
    setFormData({
      ...formData,
      keyResults: [
        ...formData.keyResults,
        {
          id: crypto.randomUUID(),
          title: '',
          measure: '',
          baseline: 0,
          target: 100,
          current: 0,
          status: 'not_started',
        },
      ],
    })
    setTimeout(() => {
      const krs = document.querySelectorAll('[data-kr-card]')
      const last = krs[krs.length - 1]
      if (last) last.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
  }

  const updateKeyResult = (index: number, field: keyof KeyResult, value: string | number) => {
    const updated = [...formData.keyResults]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, keyResults: updated })
  }

  const removeKeyResult = async (index: number) => {
    if (!(await confirm('¿Eliminar este Key Result?'))) return
    setFormData({ ...formData, keyResults: formData.keyResults.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          onClick={() => navigate('/strategy/objectives')}
          className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
        >
          <ArrowLeft size={20} className="text-neutral-60" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-neutral-90 dark:text-white">
            {objective ? 'Editar Objetivo' : 'Nuevo Objetivo'}
          </h1>
          <p className="text-sm text-muted mt-0.5">
            {objective
              ? 'Modifica los datos del objetivo y sus resultados clave'
              : 'Define un nuevo objetivo y sus resultados clave'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-neutral-50">
          <span className="hidden sm:inline">Estado:</span>
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLE[formData.status]}`}
          >
            {STATUS_ICON[formData.status]}
            {STATUS_OPTIONS.find((o) => o.value === formData.status)?.label}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Info card */}
          <div className="bg-card rounded-xl border border-boundary p-5 shadow-sm">
            <h3 className="text-sm font-bold text-neutral-90 dark:text-white flex items-center gap-2 mb-4">
              <Target size={16} className="text-primary" /> Información General
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">
                  Título del Objetivo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ej: Mejorar la experiencia del cliente en canales digitales"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Descripción</label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(html) => setFormData({ ...formData, description: html })}
                  placeholder="Describe el objetivo, su motivación y alcance..."
                />
              </div>
            </div>
          </div>

          {/* Assignment card */}
          <div className="bg-card rounded-xl border border-boundary p-5 shadow-sm">
            <h3 className="text-sm font-bold text-neutral-90 dark:text-white flex items-center gap-2 mb-4">
              <Crosshair size={16} className="text-primary" /> Asignación y Período
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Tipo"
                value={formData.type}
                onChange={(v) => setFormData({ ...formData, type: v as Objective['type'] })}
                options={[
                  { value: 'okr', label: 'OKR' },
                  { value: 'kpi', label: 'KPI' },
                  { value: 'balanced_scorecard', label: 'Balanced Scorecard' },
                ]}
              />
              <Select
                label="Equipo"
                value={formData.teamId}
                onChange={(v) => setFormData({ ...formData, teamId: v })}
                options={[
                  { value: '', label: 'Sin equipo' },
                  ...teams.map((team) => ({ value: team.id, label: team.name })),
                ]}
              />
              <Select
                label="Unidad de Negocio"
                value={formData.businessUnitId}
                onChange={(v) => setFormData({ ...formData, businessUnitId: v })}
                options={[
                  { value: '', label: 'Sin BU' },
                  ...businessUnits.map((bu) => ({ value: bu.id, label: bu.name })),
                ]}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <Select
                label="Estado"
                value={formData.status}
                onChange={(v) => setFormData({ ...formData, status: v as ObjectiveStatus })}
                options={STATUS_OPTIONS}
              />
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Inicio *</label>
                <DatePicker
                  required
                  value={formData.periodStart}
                  onChange={(v) => setFormData({ ...formData, periodStart: v })}
                  className="w-full px-3 py-2.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Fin *</label>
                <DatePicker
                  required
                  value={formData.periodEnd}
                  onChange={(v) => setFormData({ ...formData, periodEnd: v })}
                  className="w-full px-3 py-2.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          {/* Key Results card */}
          <div className="bg-card rounded-xl border border-boundary p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-neutral-90 dark:text-white flex items-center gap-2">
                <Crosshair size={16} className="text-primary" /> Key Results
                {formData.keyResults.length > 0 && (
                  <span className="text-xs font-medium text-neutral-50 bg-neutral-10 dark:bg-neutral-70 px-2 py-0.5 rounded-full">
                    {formData.keyResults.length}
                  </span>
                )}
              </h3>
              <Button
                type="button"
                onClick={addKeyResult}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-dark transition-colors"
              >
                <Plus size={14} /> Agregar KR
              </Button>
            </div>

            {formData.keyResults.length === 0 ? (
              <div className="border-2 border-dashed border-neutral-30 dark:border-neutral-60 rounded-xl p-8 text-center hover:border-primary/40 transition-colors">
                <Crosshair size={28} className="mx-auto text-neutral-40 mb-2" />
                <p className="text-sm font-medium text-muted">Sin Key Results</p>
                <p className="text-xs text-neutral-50 mt-1">
                  Agrega resultados clave medibles para este objetivo
                </p>
                <Button
                  type="button"
                  onClick={addKeyResult}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors"
                >
                  <Plus size={16} /> Agregar Key Result
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.keyResults.map((kr, index) => (
                  <KeyResultCard
                    key={kr.id}
                    kr={kr}
                    index={index}
                    onUpdate={updateKeyResult}
                    onRemove={removeKeyResult}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <ObjectivePreviewCard
            title={formData.title}
            type={formData.type}
            status={formData.status}
            keyResults={formData.keyResults}
            liveProgress={liveProgress}
            teamId={formData.teamId}
            teams={teams}
          />
          <div className="space-y-2 pt-4">
            <Button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              {objective ? 'Actualizar Objetivo' : 'Crear Objetivo'}
            </Button>
            <Button
              type="button"
              onClick={() => navigate('/strategy/objectives')}
              className="w-full px-4 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-secondary hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
