import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { useConfirm } from '@/hooks/useConfirm'
import { getCandidateTechnologies, getCandidateEvaluations, deleteCandidate, selectCandidate } from '@/services/recruitment/candidateService'
import { MEMBER_ROLE_LABELS } from '@/constants/roleLabels'
import { EVALUATION_CATEGORIES } from '@/constants/evaluationCategories'
import { ArrowLeft, Pencil, Trash2, Calendar, Mail, Phone, Briefcase, CheckCircle, UserCheck } from 'lucide-react'

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-warning/10 text-warning' },
  interviewed: { label: 'Entrevistado', color: 'bg-info/10 text-info' },
  selected: { label: 'Seleccionado', color: 'bg-success/10 text-success' },
  rejected: { label: 'Rechazado', color: 'bg-danger/10 text-danger' },
}

export function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addNotification } = useAppStore()
  const { confirm } = useConfirm()
  const [selecting, setSelecting] = useState(false)

  const candidate = useLiveQuery(() => db.candidates.get(id!), [id])
  const technologies = useLiveQuery(() => id ? getCandidateTechnologies(id) : [], [id]) ?? []
  const evaluations = useLiveQuery(() => id ? getCandidateEvaluations(id) : [], [id]) ?? []
  const teams = useLiveQuery(() => db.teams.toArray()) ?? []
  const team = candidate?.teamId ? teams.find((t) => t.id === candidate.teamId) : null

  const handleDelete = async () => {
    if (!candidate) return
    if (await confirm('¿Eliminar este candidato?')) {
      await deleteCandidate(candidate.id)
      addNotification({ type: 'success', message: 'Candidato eliminado' })
      navigate('/teams/recruitment')
    }
  }

  const handleSelect = async () => {
    if (!candidate) return
    setSelecting(true)
    try {
      await selectCandidate(candidate.id, candidate.teamId ?? '')
      addNotification({ type: 'success', message: 'Candidato seleccionado' })
      navigate('/teams/recruitment')
    } catch {
      addNotification({ type: 'error', message: 'Error al seleccionar candidato' })
    } finally {
      setSelecting(false)
    }
  }

  if (!candidate) return null

  const cfg = statusConfig[candidate.status] ?? { label: candidate.status, color: 'bg-neutral-10 text-neutral-60' }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/teams/recruitment')} className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">
            <ArrowLeft size={20} className="text-neutral-60" />
          </button>
          <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">{candidate.name}</h2>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(`/teams/recruitment/${candidate.id}/edit`)} className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 text-neutral-50 hover:text-primary transition-colors">
            <Pencil size={18} />
          </button>
          <button onClick={handleDelete} className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 text-neutral-50 hover:text-danger transition-colors">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6">
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="none" className="stroke-neutral-20 dark:stroke-neutral-70" strokeWidth="2" />
              <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2"
                strokeDasharray={`${candidate.totalScore} ${100 - candidate.totalScore}`}
                className="text-primary" strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-primary">{candidate.totalScore}%</span>
          </div>
          <div className="space-y-1">
            <p className="text-lg font-semibold text-neutral-90 dark:text-white">Puntuación General</p>
            <p className="text-sm text-neutral-60">50% tecnologías + 50% evaluación</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <InfoRow icon={<Briefcase size={16} />} label="Posición" value={MEMBER_ROLE_LABELS[candidate.position as keyof typeof MEMBER_ROLE_LABELS] ?? candidate.position} />
          <InfoRow icon={<Calendar size={16} />} label="Entrevista" value={candidate.interviewDate ? new Date(candidate.interviewDate).toLocaleDateString('es') : 'Pendiente'} />
          {candidate.email && <InfoRow icon={<Mail size={16} />} label="Email" value={candidate.email} />}
          {candidate.phone && <InfoRow icon={<Phone size={16} />} label="Teléfono" value={candidate.phone} />}
          {team && <InfoRow icon={<UserCheck size={16} />} label="Equipo" value={team.name} />}
        </div>

          {candidate.comments && (
            <div className="pt-4 border-t border-neutral-20 dark:border-neutral-70">
              <p className="text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-2">Comentarios</p>
              <div className="text-sm text-neutral-60 leading-relaxed prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: candidate.comments }} />
            </div>
          )}
      </div>

      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6">
        <h3 className="text-sm font-semibold text-neutral-90 dark:text-white mb-4">Tecnologías</h3>
        {technologies.length === 0 ? (
          <p className="text-sm text-neutral-50">Sin tecnologías registradas</p>
        ) : (
          <div className="space-y-3">
            {technologies.map((t) => (
              <div key={t.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-neutral-70 dark:text-neutral-30">{t.name}</span>
                    <span className="text-sm font-semibold text-primary">{t.points}%</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-20 dark:bg-neutral-70 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${t.points}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6">
        <h3 className="text-sm font-semibold text-neutral-90 dark:text-white mb-4">Evaluación</h3>
        {evaluations.length === 0 ? (
          <p className="text-sm text-neutral-50">Sin evaluación registrada</p>
        ) : (
          <div className="space-y-3">
            {EVALUATION_CATEGORIES.map((cat) => {
              const e = evaluations.find((ev) => ev.category === cat.key)
              const pts = e?.points ?? 0
              return (
                <div key={cat.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-neutral-70 dark:text-neutral-30">{cat.label}</span>
                    <span className="text-sm font-semibold" style={{ color: pts >= 70 ? '#22c55e' : pts >= 40 ? '#eab308' : '#ef4444' }}>{pts}%</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-20 dark:bg-neutral-70 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      width: `${pts}%`,
                      backgroundColor: pts >= 70 ? '#22c55e' : pts >= 40 ? '#eab308' : '#ef4444',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {candidate.status !== 'selected' && candidate.status !== 'rejected' && (
        <button
          onClick={handleSelect}
          disabled={selecting}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-success text-white rounded-xl font-semibold text-sm hover:bg-success-dark transition-colors disabled:opacity-50 shadow-lg shadow-success/25"
        >
          <CheckCircle size={20} />
          {selecting ? 'Seleccionando...' : 'Seleccionar Candidato'}
        </button>
      )}
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-neutral-50">{icon}</span>
      <div>
        <p className="text-xs text-neutral-50">{label}</p>
        <p className="text-sm font-medium text-neutral-90 dark:text-white">{value}</p>
      </div>
    </div>
  )
}
