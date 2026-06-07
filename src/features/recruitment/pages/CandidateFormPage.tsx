import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { createCandidate, updateCandidate, getCandidate, getCandidateTechnologies } from '@/services/recruitment/candidateService'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'

interface TechEntry {
  name: string
  points: number
}

export function CandidateFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const { addNotification } = useAppStore()

  const teams = useLiveQuery(() => db.teams.toArray()) ?? []
  const technologies = useLiveQuery(() => db.technologies.toArray()) ?? []

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [position, setPosition] = useState('')
  const [interviewDate, setInterviewDate] = useState('')
  const [comments, setComments] = useState('')
  const [status, setStatus] = useState<'pending' | 'interviewed' | 'selected' | 'rejected'>('pending')
  const [teamId, setTeamId] = useState('')
  const [techs, setTechs] = useState<TechEntry[]>([{ name: '', points: 50 }])
  const [saving, setSaving] = useState(false)

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
        setTechs(techList.map((t) => ({ name: t.name, points: t.points })))
      }
    })()
  }, [isEdit, id])

  const addTech = () => setTechs([...techs, { name: '', points: 50 }])
  const removeTech = (i: number) => setTechs(techs.filter((_, idx) => idx !== i))
  const updateTech = (i: number, field: keyof TechEntry, value: string | number) => {
    const next = [...techs]
    next[i] = { ...next[i], [field]: value }
    setTechs(next)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !position.trim()) return
    setSaving(true)

    const base = {
      name: name.trim(),
      email,
      phone,
      position: position.trim(),
      interviewDate: interviewDate ? new Date(interviewDate) : null,
      comments,
      status,
      teamId: teamId || null,
    }

    const cleanTechs = techs.filter((t) => t.name.trim())

    try {
      if (isEdit) {
        await updateCandidate(id!, base, cleanTechs)
        addNotification({ type: 'success', message: 'Candidato actualizado' })
      } else {
        await createCandidate(base, cleanTechs)
        addNotification({ type: 'success', message: 'Candidato registrado' })
      }
      navigate('/teams/recruitment')
    } catch {
      addNotification({ type: 'error', message: 'Error al guardar candidato' })
    } finally {
      setSaving(false)
    }
  }

  const techOptions = technologies.map((t) => t.name).filter((v, i, a) => a.indexOf(v) === i).sort()

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
            <input type="text" value={position} onChange={(e) => setPosition(e.target.value)} required placeholder="Ej: Desarrollador Frontend"
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
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
          <textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={3}
            className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        {/* Tecnologías */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-70 dark:text-neutral-30">Tecnologías y Puntuación</label>
            <button type="button" onClick={addTech} className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark font-medium">
              <Plus size={14} /> Agregar tecnología
            </button>
          </div>
          <div className="space-y-2">
            {techs.map((tech, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={tech.name}
                  onChange={(e) => updateTech(i, 'name', e.target.value)}
                  list="tech-options"
                  placeholder="Tecnología"
                  className="flex-1 px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <input
                  type="range"
                  min={0} max={100}
                  value={tech.points}
                  onChange={(e) => updateTech(i, 'points', parseInt(e.target.value))}
                  className="w-24 accent-primary"
                />
                <span className="text-sm font-medium text-neutral-70 dark:text-neutral-30 w-10 text-right">{tech.points}</span>
                {techs.length > 1 && (
                  <button type="button" onClick={() => removeTech(i)} className="p-1.5 rounded hover:bg-danger/10 text-neutral-50 hover:text-danger transition-colors">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <datalist id="tech-options">
            {techOptions.map((t) => <option key={t} value={t} />)}
          </datalist>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3">
          <button type="button" onClick={() => navigate('/teams/recruitment')} className="px-4 py-2 text-sm text-neutral-60 hover:text-neutral-90 dark:hover:text-white transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={saving || !name.trim() || !position.trim()}
            className="px-6 py-2 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-dark transition-colors disabled:opacity-50">
            {saving ? 'Guardando...' : isEdit ? 'Actualizar Candidato' : 'Registrar Candidato'}
          </button>
        </div>
      </form>
    </div>
  )
}
