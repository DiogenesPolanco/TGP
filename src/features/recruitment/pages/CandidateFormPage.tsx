import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { createCandidate, updateCandidate, getCandidate, getCandidateTechnologies, getCandidateEvaluations } from '@/services/recruitment/candidateService'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import { MEMBER_ROLE_LABELS, MEMBER_ROLES } from '@/constants/roleLabels'
import { EVALUATION_CATEGORIES } from '@/constants/evaluationCategories'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { TechSearch } from '@/components/ui/TechSearch'
import { DatePicker } from '@/components/ui/DatePicker'
import { Select } from '@/components/ui/Select'
import type { EvalCategory } from '@/types/domain'
import { Button } from '@/components/ui/Button'
import { parseLocalDate } from '@/lib/utils'

export function CandidateFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const { addNotification } = useAppStore()

  const teams = useLiveQuery(() => db.teams.toArray()) ?? []
  const allTechnologies = useLiveQuery(() => db.technologies.toArray()) ?? []

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [position, setPosition] = useState('')
  const [interviewDate, setInterviewDate] = useState('')
  const [comments, setComments] = useState('')
  const [status, setStatus] = useState<'pending' | 'interviewed' | 'selected' | 'rejected' | 'no_show'>('pending')
  const [teamId, setTeamId] = useState('')
  const [saving, setSaving] = useState(false)

  const [selectedTechIds, setSelectedTechIds] = useState<string[]>([])
  const [techScores, setTechScores] = useState<Record<string, number>>({})

  const [evalScores, setEvalScores] = useState<Record<EvalCategory, number>>(() =>
    Object.fromEntries(EVALUATION_CATEGORIES.map((c) => [c.key, 50])) as Record<EvalCategory, number>,
  )

  useEffect(() => {
    if (!isEdit) return
    ;(async () => {
      const c = await getCandidate(id!)
      if (!c) return
      setName(c.name)
      setEmail(c.email)
      setPhone(c.phone)
      setPosition(c.position)
      setInterviewDate(c.interviewDate ? new Date(c.interviewDate).toISOString().split('T')[0] : '')
      setComments(c.comments)
      setStatus(c.status)
      setTeamId(c.teamId ?? '')
      const techList = await getCandidateTechnologies(id!)
      if (techList.length > 0) {
        const techMap: Record<string, number> = {}
        const ids: string[] = []
        for (const t of techList) {
          const match = allTechnologies.find((at) => at.name === t.name)
          if (match) {
            ids.push(match.id)
            techMap[match.id] = t.points
          }
        }
        setSelectedTechIds(ids)
        setTechScores(techMap)
      }
      const evalList = await getCandidateEvaluations(id!)
      if (evalList.length > 0) {
        setEvalScores((prev) => {
          const next = { ...prev }
          for (const e of evalList) {
            next[e.category] = e.points
          }
          return next
        })
      }
    })()
  }, [isEdit, id, allTechnologies])

  const updateScore = (techId: string, points: number) => {
    setTechScores({ ...techScores, [techId]: points })
  }

  const selectedTechs = allTechnologies.filter((t) => selectedTechIds.includes(t.id))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !position) return
    setSaving(true)

    const base = {
      name: name.trim(),
      email,
      phone,
      position,
      interviewDate: interviewDate ? parseLocalDate(interviewDate) : null,
      comments,
      status,
      teamId: teamId || null,
    }

    const cleanTechs = selectedTechIds.map((techId) => {
      const tech = allTechnologies.find((t) => t.id === techId)
      return { name: tech?.name ?? techId, points: techScores[techId] ?? 50 }
    })

    const cleanEvals = EVALUATION_CATEGORIES.map((c) => ({
      category: c.key,
      points: evalScores[c.key],
    }))

    try {
      if (isEdit) {
        await updateCandidate(id!, base, cleanTechs, cleanEvals)
        addNotification({ type: 'success', message: 'Candidato actualizado' })
      } else {
        await createCandidate(base, cleanTechs, cleanEvals)
        addNotification({ type: 'success', message: 'Candidato registrado' })
      }
      navigate('/teams/recruitment')
    } catch {
      addNotification({ type: 'error', message: 'Error al guardar candidato' })
    } finally {
      setSaving(false)
    }
  }

  const roleOptions = MEMBER_ROLES.map((role) => ({
    value: role,
    label: MEMBER_ROLE_LABELS[role],
  }))

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button onClick={() => navigate('/teams/recruitment')} className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">
          <ArrowLeft size={20} className="text-neutral-60" />
        </Button>
        <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">{isEdit ? 'Editar Candidato' : 'Nuevo Candidato'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-boundary p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-secondary">Nombre *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-secondary">Posición *</label>
            <Select value={position} onChange={(v) => setPosition(v)} required options={[
              { value: '', label: 'Seleccionar rol...' },
              ...roleOptions.map((r) => ({ value: r.value, label: r.label })),
            ]} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-secondary">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-secondary">Teléfono</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-secondary">Fecha de Entrevista</label>
            <DatePicker value={interviewDate} onChange={setInterviewDate}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-secondary">Estado</label>
            <Select value={status} onChange={(v) => setStatus(v as any)} options={[
              { value: 'pending', label: 'Pendiente' },
              { value: 'interviewed', label: 'Entrevistado' },
              { value: 'selected', label: 'Seleccionado' },
              { value: 'rejected', label: 'Rechazado' },
              { value: 'no_show', label: 'No Asistió' },
            ]} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-secondary">Equipo (opcional)</label>
            <Select value={teamId} onChange={(v) => setTeamId(v)} options={[
              { value: '', label: 'Sin equipo' },
              ...teams.map((t) => ({ value: t.id, label: t.name })),
            ]} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-secondary">Comentarios de la Entrevista</label>
          <RichTextEditor
            value={comments}
            onChange={setComments}
            placeholder="Registra tus observaciones sobre la entrevista..."
            minHeight="180px"
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-secondary">
            Tecnologías y Puntuación <span className="text-neutral-50 font-normal">({selectedTechIds.length} seleccionadas)</span>
          </label>
          <TechSearch
            selectedIds={selectedTechIds}
            onChange={(ids) => {
              // Initialize score for newly added technologies
              const added = ids.filter(id => !selectedTechIds.includes(id))
              if (added.length > 0) {
                setTechScores(prev => {
                  const next = { ...prev }
                  for (const id of added) next[id] = 50
                  return next
                })
              }
              setSelectedTechIds(ids)
            }}
            enableDepsSearch={true}
          />

          {selectedTechs.length > 0 && (
            <div className="space-y-3 pt-2">
              <p className="text-xs font-medium text-neutral-50 uppercase tracking-wider">Puntuar conocimientos</p>
              {selectedTechs.map((tech) => (
                <div key={tech.id} className="flex items-center gap-3">
                  <span className="text-sm text-secondary w-32 truncate shrink-0">{tech.name}</span>
                  <input type="range" min={0} max={100} value={techScores[tech.id] ?? 50}
                    onChange={(e) => updateScore(tech.id, parseInt(e.target.value))}
                    className="flex-1 accent-primary" />
                  <span className="text-sm font-semibold text-primary w-10 text-right">{techScores[tech.id] ?? 50}</span>
                </div>
              ))}
            </div>
          )}

          {selectedTechs.some((t) => t.supportStatus === 'eol') && (
            <p className="text-xs text-danger mt-1 flex items-center gap-1">
              <AlertTriangle size={12} />
              El candidato con tecnologías EOL puede no ser ideal
            </p>
          )}
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-semibold text-secondary">
            Evaluación del Candidato
          </label>
          <p className="text-xs text-neutral-50">Puntúa cada dimensión del 0 al 100 para calcular el score final</p>
          <div className="space-y-3">
            {EVALUATION_CATEGORIES.map((cat) => (
              <div key={cat.key} className="flex items-center gap-3">
                <span className="text-sm text-secondary w-44 shrink-0">{cat.label}</span>
                <input type="range" min={0} max={100} value={evalScores[cat.key]}
                  onChange={(e) => setEvalScores({ ...evalScores, [cat.key]: parseInt(e.target.value) })}
                  className="flex-1 accent-primary" />
                <span className="text-sm font-semibold text-primary w-10 text-right">{evalScores[cat.key]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3">
          <Button type="button" onClick={() => navigate('/teams/recruitment')} className="px-4 py-2 text-sm text-neutral-60 hover:text-neutral-90 dark:hover:text-white transition-colors">
            Cancelar
          </Button>
          <Button type="submit" disabled={saving || !name.trim() || !position} className="px-6 py-2 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-dark transition-colors disabled:opacity-50">
            {saving ? 'Guardando...' : isEdit ? 'Actualizar Candidato' : 'Registrar Candidato'}
          </Button>
        </div>
      </form>
    </div>
  )
}
