import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { Plus, ArrowLeft, Trash2, Target, Crosshair, TrendingUp, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { useConfirm } from '@/hooks/useConfirm'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import { DatePicker } from '@/components/ui/DatePicker'
import { Select } from '@/components/ui/Select'
import type { Objective, KeyResult, ObjectiveStatus } from '@/types/domain'

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'No iniciado' },
  { value: 'on_track', label: 'Encaminado' },
  { value: 'at_risk', label: 'En riesgo' },
  { value: 'behind', label: 'Atrasado' },
  { value: 'achieved', label: 'Logrado' },
]

const STATUS_STYLE: Record<string, string> = {
  not_started: 'bg-neutral-10 dark:bg-neutral-70 text-neutral-60 border-neutral-30',
  on_track: 'bg-success/10 text-success border-success/30',
  at_risk: 'bg-warning/10 text-warning border-warning/30',
  behind: 'bg-danger/10 text-danger border-danger/30',
  achieved: 'bg-success/10 text-success border-success/30',
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  not_started: <HelpCircle size={14} />,
  on_track: <TrendingUp size={14} />,
  at_risk: <AlertCircle size={14} />,
  behind: <AlertCircle size={14} />,
  achieved: <CheckCircle2 size={14} />,
}

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
    if (objective) {
      queueMicrotask(() => {
        setFormData({
          title: objective.title ?? '',
          description: objective.description ?? '',
          type: objective.type ?? 'okr',
          teamId: objective.teamId ?? '',
          businessUnitId: objective.businessUnitId ?? '',
          periodStart: objective.periodStart && !isNaN(new Date(objective.periodStart).getTime()) ? new Date(objective.periodStart).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          periodEnd: objective.periodEnd && !isNaN(new Date(objective.periodEnd).getTime()) ? new Date(objective.periodEnd).toISOString().split('T')[0] : '',
          status: objective.status ?? 'not_started',
          keyResults: objective.keyResults ?? [],
        })
      })
    }
  }, [objective])

  const liveProgress = useMemo(() => {
    if (formData.keyResults.length === 0) return 0
    return Math.min(100, formData.keyResults.reduce((sum, kr) => {
      if (kr.target <= kr.baseline) return sum
      return sum + Math.round(((kr.current - kr.baseline) / (kr.target - kr.baseline)) * 100)
    }, 0) / formData.keyResults.length)
  }, [formData.keyResults])

  const progressColor = liveProgress >= 100 ? 'bg-success' : liveProgress >= 60 ? 'bg-success' : liveProgress >= 30 ? 'bg-warning' : 'bg-danger'

  if (id && !objective) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center gap-3 text-neutral-50">
        <div className="w-5 h-5 rounded-full border-2 border-neutral-30 border-t-primary animate-spin" />
        Cargando...
      </div>
    </div>
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      ...formData,
      teamId: formData.teamId || null,
      businessUnitId: formData.businessUnitId || null,
      periodStart: new Date(formData.periodStart),
      periodEnd: new Date(formData.periodEnd),
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
      keyResults: [...formData.keyResults, {
        id: crypto.randomUUID(),
        title: '',
        measure: '',
        baseline: 0,
        target: 100,
        current: 0,
        status: 'not_started',
      }],
    })
    // Scroll to new KR after render
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
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/strategy/objectives')} className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">
          <ArrowLeft size={20} className="text-neutral-60" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-neutral-90 dark:text-white">
            {objective ? 'Editar Objetivo' : 'Nuevo Objetivo'}
          </h1>
          <p className="text-sm text-neutral-60 dark:text-neutral-40 mt-0.5">
            {objective ? 'Modifica los datos del objetivo y sus resultados clave' : 'Define un nuevo objetivo y sus resultados clave'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-neutral-50">
          <span className="hidden sm:inline">Estado:</span>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLE[formData.status]}`}>
            {STATUS_ICON[formData.status]}
            {STATUS_OPTIONS.find((o) => o.value === formData.status)?.label}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Información General */}
          <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-neutral-90 dark:text-white flex items-center gap-2 mb-4">
              <Target size={16} className="text-primary" />
              Información General
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-60 dark:text-neutral-40 mb-1.5">Título del Objetivo *</label>
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
                <label className="block text-xs font-medium text-neutral-60 dark:text-neutral-40 mb-1.5">Descripción</label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(html) => setFormData({ ...formData, description: html })}
                  placeholder="Describe el objetivo, su motivación y alcance..."
                />
              </div>
            </div>
          </div>

          {/* Card: Asignación y Período */}
          <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-neutral-90 dark:text-white flex items-center gap-2 mb-4">
              <Crosshair size={16} className="text-primary" />
              Asignación y Período
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select label="Tipo" value={formData.type} onChange={(v) => setFormData({ ...formData, type: v as Objective['type'] })} options={[
                { value: 'okr', label: 'OKR' },
                { value: 'kpi', label: 'KPI' },
                { value: 'balanced_scorecard', label: 'Balanced Scorecard' },
              ]} />
              <Select label="Equipo" value={formData.teamId} onChange={(v) => setFormData({ ...formData, teamId: v })} options={[
                { value: '', label: 'Sin equipo' },
                ...teams.map((team) => ({ value: team.id, label: team.name })),
              ]} />
              <Select label="Unidad de Negocio" value={formData.businessUnitId} onChange={(v) => setFormData({ ...formData, businessUnitId: v })} options={[
                { value: '', label: 'Sin BU' },
                ...businessUnits.map((bu) => ({ value: bu.id, label: bu.name })),
              ]} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <Select label="Estado" value={formData.status} onChange={(v) => setFormData({ ...formData, status: v as ObjectiveStatus })} options={STATUS_OPTIONS} />
              <div>
                <label className="block text-xs font-medium text-neutral-60 dark:text-neutral-40 mb-1.5">Inicio *</label>
                <DatePicker
                  required
                  value={formData.periodStart}
                  onChange={(v) => setFormData({ ...formData, periodStart: v })}
                  className="w-full px-3 py-2.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-60 dark:text-neutral-40 mb-1.5">Fin *</label>
                <DatePicker
                  required
                  value={formData.periodEnd}
                  onChange={(v) => setFormData({ ...formData, periodEnd: v })}
                  className="w-full px-3 py-2.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          {/* Card: Key Results */}
          <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-neutral-90 dark:text-white flex items-center gap-2">
                <Crosshair size={16} className="text-primary" />
                Key Results
                {formData.keyResults.length > 0 && (
                  <span className="text-xs font-medium text-neutral-50 bg-neutral-10 dark:bg-neutral-70 px-2 py-0.5 rounded-full">{formData.keyResults.length}</span>
                )}
              </h3>
              <button
                type="button"
                onClick={addKeyResult}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-dark transition-colors"
              >
                <Plus size={14} />
                Agregar KR
              </button>
            </div>

            {formData.keyResults.length === 0 ? (
              <div className="border-2 border-dashed border-neutral-30 dark:border-neutral-60 rounded-xl p-8 text-center hover:border-primary/40 transition-colors">
                <Crosshair size={28} className="mx-auto text-neutral-40 mb-2" />
                <p className="text-sm font-medium text-neutral-60 dark:text-neutral-40">Sin Key Results</p>
                <p className="text-xs text-neutral-50 mt-1">Agrega resultados clave medibles para este objetivo</p>
                <button
                  type="button"
                  onClick={addKeyResult}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors"
                >
                  <Plus size={16} />
                  Agregar Key Result
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.keyResults.map((kr, index) => {
                  const krPct = kr.target > kr.baseline
                    ? Math.round(((kr.current - kr.baseline) / (kr.target - kr.baseline)) * 100)
                    : 0
                  const krClamped = Math.min(100, Math.max(0, krPct))
                  return (
                    <div
                      key={kr.id}
                      data-kr-card
                      className="bg-neutral-10 dark:bg-neutral-70/50 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 hover:border-primary/20 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Nombre del Key Result"
                            value={kr.title}
                            onChange={(e) => updateKeyResult(index, 'title', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-white dark:bg-neutral-80 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={kr.status}
                            onChange={(e) => updateKeyResult(index, 'status', e.target.value)}
                            className={`text-xs px-2 py-1.5 rounded-lg border font-medium cursor-pointer ${STATUS_STYLE[kr.status]}`}
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => removeKeyResult(index)}
                            className="p-1.5 rounded-lg text-neutral-50 hover:text-danger hover:bg-danger/10 transition-colors"
                            title="Eliminar KR"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div>
                          <label className="block text-[10px] font-medium text-neutral-50 uppercase tracking-wider mb-1">Medida</label>
                          <input
                            type="text"
                            placeholder="Ej: %"
                            value={kr.measure}
                            onChange={(e) => updateKeyResult(index, 'measure', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-white dark:bg-neutral-80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-neutral-50 uppercase tracking-wider mb-1">Línea Base</label>
                          <input
                            type="number"
                            placeholder="0"
                            value={kr.baseline}
                            onChange={(e) => updateKeyResult(index, 'baseline', parseFloat(e.target.value) || 0)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-white dark:bg-neutral-80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-neutral-50 uppercase tracking-wider mb-1">Actual</label>
                          <input
                            type="number"
                            placeholder="0"
                            value={kr.current}
                            onChange={(e) => updateKeyResult(index, 'current', parseFloat(e.target.value) || 0)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-white dark:bg-neutral-80 text-sm font-semibold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-neutral-50 uppercase tracking-wider mb-1">Meta</label>
                          <input
                            type="number"
                            placeholder="100"
                            value={kr.target}
                            onChange={(e) => updateKeyResult(index, 'target', parseFloat(e.target.value) || 0)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-white dark:bg-neutral-80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                      </div>

                      {/* KR mini progress bar */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-neutral-50 w-10">Progreso</span>
                        <div className="flex-1 h-1.5 bg-neutral-20 dark:bg-neutral-70 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              krClamped >= 100 ? 'bg-success' : krClamped >= 60 ? 'bg-success' : krClamped >= 30 ? 'bg-warning' : 'bg-danger'
                            }`}
                            style={{ width: `${krClamped}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-neutral-90 dark:text-white tabular-nums w-8 text-right">{krClamped}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Live Preview */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-5 shadow-sm sticky top-6 space-y-4">
            <h3 className="text-sm font-bold text-neutral-90 dark:text-white flex items-center gap-2">
              <Target size={16} className="text-primary" />
              Vista Previa
            </h3>

            {/* Live preview card */}
            <div className="bg-neutral-10 dark:bg-neutral-70/50 rounded-xl border border-neutral-20 dark:border-neutral-70 overflow-hidden">
              <div className={`h-1 w-full ${formData.status === 'achieved' || formData.status === 'on_track' ? 'bg-success' : formData.status === 'at_risk' ? 'bg-warning' : formData.status === 'behind' ? 'bg-danger' : 'bg-neutral-40'}`} />
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_STYLE[formData.status]}`}>
                    {STATUS_ICON[formData.status]}
                    {STATUS_OPTIONS.find((o) => o.value === formData.status)?.label}
                  </span>
                  <span className="text-[10px] font-medium text-neutral-50 uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-10 dark:bg-neutral-70">
                    {formData.type === 'okr' ? 'OKR' : formData.type === 'kpi' ? 'KPI' : 'BSC'}
                  </span>
                </div>

                <p className="text-sm font-semibold text-neutral-90 dark:text-white mb-1 line-clamp-2">
                  {formData.title || 'Sin título'}
                </p>

                <div className="flex items-center justify-between mt-3 mb-1.5">
                  <span className="text-[11px] text-neutral-50">Progreso general</span>
                  <span className="text-sm font-bold text-neutral-90 dark:text-white tabular-nums">{Math.round(liveProgress)}%</span>
                </div>
                <div className="w-full h-2 bg-neutral-20 dark:bg-neutral-70 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${progressColor}`} style={{ width: `${liveProgress}%` }} />
                </div>

                <div className="mt-3 pt-3 border-t border-neutral-20 dark:border-neutral-70">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-50">Key Results</span>
                    <span className="font-semibold text-neutral-90 dark:text-white">{formData.keyResults.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-neutral-50">Equipo</span>
                    <span className="font-semibold text-neutral-90 dark:text-white truncate max-w-[120px] text-right">
                      {formData.teamId ? teams.find((t) => t.id === formData.teamId)?.name : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick tips */}
            <div className="bg-neutral-10 dark:bg-neutral-70/40 rounded-lg p-3 space-y-1.5">
              <p className="text-xs font-semibold text-neutral-70 dark:text-neutral-30 flex items-center gap-1.5">
                <HelpCircle size={12} />
                Tips
              </p>
              <ul className="text-[11px] text-neutral-60 dark:text-neutral-40 space-y-1 list-disc list-inside">
                <li>Usa métricas específicas y medibles</li>
                <li>Define metas alcanzables pero desafiantes</li>
                <li>Los KRs deben estar vinculados al objetivo</li>
                <li>Actualiza el progreso regularmente</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
              >
                {objective ? 'Actualizar Objetivo' : 'Crear Objetivo'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/strategy/objectives')}
                className="w-full px-4 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-70 dark:text-neutral-30 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
