import { useState } from 'react'
import { db } from '@/services/db/database'
import type { MemberProfile, MemberStatus } from '@/types/domain'
import { MEMBER_STATUS_LABELS } from '@/constants/roleLabels'
import { Save, AtSign, Phone, Home, MapPin, Briefcase, Calendar, Umbrella, Clock } from 'lucide-react'

interface Props {
  memberId: string
  memberDisplayName: string
  profile: MemberProfile | null
}

export function ProfileSection({ memberId, memberDisplayName, profile }: Props) {
  const [form, setForm] = useState<{
    email: string; phoneCell: string; phoneHome: string; address: string
    role: string; status: string; vacationDaysPerYear: number; vacationUsed: number
  }>({
    email: profile?.email ?? '',
    phoneCell: profile?.phoneCell ?? '',
    phoneHome: profile?.phoneHome ?? '',
    address: profile?.address ?? '',
    role: profile?.role ?? 'developer',
    status: (profile as any)?.status ?? 'activo',
    vacationDaysPerYear: profile?.vacationDaysPerYear ?? 14,
    vacationUsed: profile?.vacationUsed ?? 0,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const now = new Date()
    const data: MemberProfile = {
      id: memberId,
      teamId: '',
      skills: profile?.skills ?? [],
      technologies: profile?.technologies ?? [],
      microservices: (profile as any)?.microservices ?? [],
      avgStoryPoints: profile?.avgStoryPoints ?? 0,
      createdAt: profile?.createdAt ?? now,
      updatedAt: now,
      ...form,
      role: form.role as MemberProfile['role'],
    }
    await db.memberProfiles.put(data)

    const allTeams = await db.teams.toArray()
    for (const t of allTeams) {
      const member = t.members.find((m) => m.id === memberId)
      if (member) {
        const updatedMembers = t.members.map((m) =>
          m.id === memberId
            ? { ...m, role: data.role as any, status: (form.status as MemberStatus) }
            : m
        )
        await db.teams.update(t.id, { members: updatedMembers })
      }
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const inputClass = 'w-full rounded-lg border border-neutral-30 dark:border-neutral-60 bg-white dark:bg-neutral-80 px-3 py-2 text-sm text-neutral-90 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'

  return (
    <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
          {memberDisplayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-neutral-90 dark:text-white">{memberDisplayName}</h2>
          <p className="text-sm text-neutral-50">Información de Perfil</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">
            <AtSign size={14} /> Correo Electrónico
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={inputClass}
            placeholder="correo@ejemplo.com"
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">
            <Briefcase size={14} /> Rol
          </label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className={inputClass}
          >
            <option value="developer">Developer</option>
            <option value="senior_developer">Senior Developer</option>
            <option value="tech_lead">Tech Lead</option>
            <option value="architect">Arquitecto</option>
            <option value="qa">QA</option>
            <option value="devops">DevOps</option>
            <option value="product_owner">Product Owner</option>
            <option value="scrum_master">Scrum Master</option>
            <option value="ux_designer">UX Designer</option>
            <option value="analyst">Analista</option>
            <option value="manager">Manager</option>
            <option value="intern">Intern</option>
            <option value="other">Otro</option>
          </select>
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">
            <Clock size={14} /> Estado
          </label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className={inputClass}
          >
            {Object.entries(MEMBER_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">
            <Phone size={14} /> Teléfono Celular
          </label>
          <input
            type="tel"
            value={form.phoneCell}
            onChange={(e) => setForm({ ...form, phoneCell: e.target.value })}
            className={inputClass}
            placeholder="+51 999 999 999"
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">
            <Home size={14} /> Teléfono Casa
          </label>
          <input
            type="tel"
            value={form.phoneHome}
            onChange={(e) => setForm({ ...form, phoneHome: e.target.value })}
            className={inputClass}
            placeholder="+51 1 234 5678"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">
            <MapPin size={14} /> Dirección
          </label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className={inputClass}
            placeholder="Dirección completa"
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">
            <Umbrella size={14} /> Vacaciones por Año
          </label>
          <input
            type="number"
            value={form.vacationDaysPerYear}
            onChange={(e) => setForm({ ...form, vacationDaysPerYear: Number(e.target.value) })}
            className={inputClass}
            min={0}
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">
            <Calendar size={14} /> Vacaciones Usadas
          </label>
          <input
            type="number"
            value={form.vacationUsed}
            onChange={(e) => setForm({ ...form, vacationUsed: Number(e.target.value) })}
            className={inputClass}
            min={0}
          />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? 'Guardando...' : 'Guardar Perfil'}
        </button>
        {saved && (
          <span className="text-sm text-green-600 dark:text-green-400">
            Perfil guardado exitosamente
          </span>
        )}
      </div>
    </div>
  )
}
