import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { createCandidate, updateCandidate, getCandidate, getCandidateTechnologies, getCandidateEvaluations } from '@/services/recruitment/candidateService'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import { MEMBER_ROLE_LABELS, MEMBER_ROLES } from '@/constants/roleLabels'
import { EVALUATION_CATEGORIES } from '@/constants/evaluationCategories'
import { Plus, X, ArrowLeft, AlertTriangle } from 'lucide-react'
import type { SupportStatus, EvalCategory } from '@/types/domain'

const statusLabel: Record<SupportStatus, string> = {
  active: 'Activo',
  extended: 'S. Extendido',
  eol: 'EOL',
  unknown: '?',
}

const statusColors: Record<SupportStatus, string> = {
  active: 'bg-success/10 text-success border-success/30',
  extended: 'bg-warning/10 text-warning border-warning/30',
  eol: 'bg-danger/10 text-danger border-danger/30',
  unknown: 'bg-neutral-10 dark:bg-neutral-70 text-neutral-60 border-neutral-30',
}

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
  const [status, setStatus] = useState<'pending' | 'interviewed' | 'selected' | 'rejected'>('pending')
  const [teamId, setTeamId] = useState('')
  const [saving, setSaving] = useState(false)

  const [selectedTechIds, setSelectedTechIds] = useState<string[]>([])
  const [techScores, setTechScores] = useState<Record<string, number>>({})
  const [techSearch, setTechSearch] = useState('')
  const [showTechDropdown, setShowTechDropdown] = useState(false)

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
  }, [isEdit, id, allTechnologies, comments])

  const addTechnology = (techId: string) => {
    if (selectedTechIds.includes(techId)) return
    setSelectedTechIds([...selectedTechIds, techId])
    setTechScores({ ...techScores, [techId]: 50 })
    setTechSearch('')
  }

  const removeTechnology = (techId: string) => {
    setSelectedTechIds(selectedTechIds.filter((id) => id !== techId))
    const { [techId]: _, ...rest } = techScores
    setTechScores(rest)
  }

  const updateScore = (techId: string, points: number) => {
    setTechScores({ ...techScores, [techId]: points })
  }

  const availableTechs = allTechnologies.filter(
    (t) => !selectedTechIds.includes(t.id) &&
      (!techSearch || t.name.toLowerCase().includes(techSearch.toLowerCase()) || t.vendor.toLowerCase().includes(techSearch.toLowerCase())),
  )

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
      interviewDate: interviewDate ? new Date(interviewDate) : null,
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
        <button onClick={() => navigate('/teams/recruitment')} className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">
          <ArrowLeft size={20} className="text-neutral-60" />
        </button>
        <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">{isEdit ? 'Editar Candidato' : 'Nuevo Candidato'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-70 dark:text-neutral-30">Nombre *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-70 dark:text-neutral-30">Posición *</label>
            <select value={position} onChange={(e) => setPosition(e.target.value)} required
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">Seleccionar rol...</option>
              {roleOptions.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-70 dark:text-neutral-30">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-70 dark:text-neutral-30">Teléfono</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-70 dark:text-neutral-30">Fecha de Entrevista</label>
            <input type="date" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-70 dark:text-neutral-30">Estado</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="pending">Pendiente</option>
              <option value="interviewed">Entrevistado</option>
              <option value="selected">Seleccionado</option>
              <option value="rejected">Rechazado</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-70 dark:text-neutral-30">Equipo (opcional)</label>
            <select value={teamId} onChange={(e) => setTeamId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">Sin equipo</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-70 dark:text-neutral-30">Comentarios de la Entrevista</label>
          <RichTextEditor
            value={comments}
            onChange={setComments}
            placeholder="Registra tus observaciones sobre la entrevista..."
            minHeight="180px"
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30">
            Tecnologías y Puntuación <span className="text-neutral-50 font-normal">({selectedTechIds.length} seleccionadas)</span>
          </label>

          {selectedTechs.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedTechs.map((tech) => (
                <span key={tech.id} className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${statusColors[tech.supportStatus]}`}>
                  {tech.supportStatus === 'eol' && <AlertTriangle size={12} />}
                  {tech.name} {tech.version}
                  <button type="button" onClick={() => removeTechnology(tech.id)} className="ml-0.5 hover:opacity-70 transition-opacity">
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input type="text" placeholder="Buscar tecnología para agregar..."
                  value={techSearch}
                  onFocus={() => setShowTechDropdown(true)}
                  onChange={(e) => { setTechSearch(e.target.value); setShowTechDropdown(true) }}
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                <Plus size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-50" />
              </div>
            </div>

            {showTechDropdown && (
              <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-neutral-80 border border-neutral-20 dark:border-neutral-70 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                {availableTechs.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-neutral-50">
                    {techSearch ? 'Sin resultados' : 'Todas las tecnologías ya están seleccionadas'}
                  </p>
                ) : (
                  availableTechs.map((tech) => (
                    <button key={tech.id} type="button"
                      onClick={() => addTechnology(tech.id)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-90 dark:text-white">{tech.name}</span>
                        <span className="text-neutral-50">{tech.version}</span>
                        <span className="text-xs text-neutral-50">({tech.vendor})</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[tech.supportStatus]}`}>
                        {statusLabel[tech.supportStatus]}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {selectedTechs.length > 0 && (
            <div className="space-y-3 pt-2">
              <p className="text-xs font-medium text-neutral-50 uppercase tracking-wider">Puntuar conocimientos</p>
              {selectedTechs.map((tech) => (
                <div key={tech.id} className="flex items-center gap-3">
                  <span className="text-sm text-neutral-70 dark:text-neutral-30 w-32 truncate shrink-0">{tech.name}</span>
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
          <label className="block text-sm font-semibold text-neutral-70 dark:text-neutral-30">
            Evaluación del Candidato
          </label>
          <p className="text-xs text-neutral-50">Puntúa cada dimensión del 0 al 100 para calcular el score final</p>
          <div className="space-y-3">
            {EVALUATION_CATEGORIES.map((cat) => (
              <div key={cat.key} className="flex items-center gap-3">
                <span className="text-sm text-neutral-70 dark:text-neutral-30 w-44 shrink-0">{cat.label}</span>
                <input type="range" min={0} max={100} value={evalScores[cat.key]}
                  onChange={(e) => setEvalScores({ ...evalScores, [cat.key]: parseInt(e.target.value) })}
                  className="flex-1 accent-primary" />
                <span className="text-sm font-semibold text-primary w-10 text-right">{evalScores[cat.key]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3">
          <button type="button" onClick={() => navigate('/teams/recruitment')} className="px-4 py-2 text-sm text-neutral-60 hover:text-neutral-90 dark:hover:text-white transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={saving || !name.trim() || !position}
            className="px-6 py-2 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-dark transition-colors disabled:opacity-50">
            {saving ? 'Guardando...' : isEdit ? 'Actualizar Candidato' : 'Registrar Candidato'}
          </button>
        </div>
      </form>
    </div>
  )
}
