import { useState } from 'react'
import { db } from '@/services/db/database'
import type { MemberProfile, MemberStatus } from '@/types/domain'
import { MEMBER_STATUS_LABELS } from '@/constants/roleLabels'
import {
  Save,
  AtSign,
  Phone,
  Home,
  MapPin,
  Briefcase,
  Calendar,
  Umbrella,
  Clock,
} from 'lucide-react'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

interface Props {
  memberId: string
  memberDisplayName: string
  profile: MemberProfile | null
}

export function ProfileSection({ memberId, memberDisplayName, profile }: Props) {
  const [form, setForm] = useState<{
    email: string
    phoneCell: string
    phoneHome: string
    address: string
    role: string
    status: string
    vacationDaysPerYear: number
    vacationUsed: number
  }>({
    email: profile?.email ?? '',
    phoneCell: profile?.phoneCell ?? '',
    phoneHome: profile?.phoneHome ?? '',
    address: profile?.address ?? '',
    role: profile?.role ?? 'developer',
    status: profile?.status ?? 'activo',
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
      microservices: profile?.microservices ?? [],
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
          m.id === memberId ? { ...m, role: data.role, status: form.status as MemberStatus } : m,
        )
        await db.teams.update(t.id, { members: updatedMembers })
      }
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const inputClass =
    'w-full rounded-lg border border-neutral-30 dark:border-neutral-60 bg-card px-3 py-2 text-sm text-neutral-90 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'

  return (
    <div className="bg-card rounded-xl border border-boundary p-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
          {memberDisplayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-neutral-90 dark:text-white">
            {memberDisplayName}
          </h2>
          <p className="text-sm text-neutral-50">Información de Perfil</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-secondary mb-1.5">
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
          <label className="flex items-center gap-2 text-sm font-medium text-secondary mb-1.5">
            <Briefcase size={14} /> Rol
          </label>
          <Select
            value={form.role}
            onChange={(v) => setForm({ ...form, role: v })}
            options={[
              { value: 'developer', label: 'Developer' },
              { value: 'senior_developer', label: 'Senior Developer' },
              { value: 'tech_lead', label: 'Tech Lead' },
              { value: 'architect', label: 'Arquitecto' },
              { value: 'qa', label: 'QA' },
              { value: 'devops', label: 'DevOps' },
              { value: 'product_owner', label: 'Product Owner' },
              { value: 'scrum_master', label: 'Scrum Master' },
              { value: 'ux_designer', label: 'UX Designer' },
              { value: 'analyst', label: 'Analista' },
              { value: 'manager', label: 'Manager' },
              { value: 'intern', label: 'Intern' },
              { value: 'other', label: 'Otro' },
            ]}
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-secondary mb-1.5">
            <Clock size={14} /> Estado
          </label>
          <Select
            value={form.status}
            onChange={(v) => setForm({ ...form, status: v })}
            options={Object.entries(MEMBER_STATUS_LABELS).map(([k, v]) => ({ value: k, label: v }))}
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-secondary mb-1.5">
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
          <label className="flex items-center gap-2 text-sm font-medium text-secondary mb-1.5">
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
          <label className="flex items-center gap-2 text-sm font-medium text-secondary mb-1.5">
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
          <label className="flex items-center gap-2 text-sm font-medium text-secondary mb-1.5">
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
          <label className="flex items-center gap-2 text-sm font-medium text-secondary mb-1.5">
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
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? 'Guardando...' : 'Guardar Perfil'}
        </Button>
        {saved && (
          <span className="text-sm text-green-600 dark:text-green-400">
            Perfil guardado exitosamente
          </span>
        )}
      </div>
    </div>
  )
}
