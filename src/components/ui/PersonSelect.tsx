import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useUserStore } from '@/stores/userStore'

interface PersonSelectProps {
  value: string
  onChange: (id: string) => void
  label?: string
  placeholder?: string
  required?: boolean
}

export function PersonSelect({ value, onChange, label, placeholder = 'Seleccionar persona...', required = false }: PersonSelectProps) {
  const teams = useLiveQuery(() => db.teams.toArray()) ?? []
  const currentUser = useUserStore((s) => s.currentUser)

  // Build unique person list with team context
  const personOptions = useMemo(() => {
    const seen = new Set<string>()
    const options: { id: string; label: string; teamName: string }[] = []
    for (const team of teams) {
      for (const m of team.members) {
        if (!seen.has(m.id)) {
          seen.add(m.id)
          options.push({ id: m.id, label: m.displayName, teamName: team.name })
        }
      }
    }
    return options.sort((a, b) => a.label.localeCompare(b.label))
  }, [teams])

  // If current value doesn't match any option, show it as a fallback
  const hasValue = value && value !== '__me__' && value !== 'unknown'
  const valueInOptions = hasValue && personOptions.some((o) => o.id === value)

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value)
  }

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">
          {label}{required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={handleChange}
        required={required}
        className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <option value="">{placeholder}</option>
        {currentUser && (
          <option value="__me__">
            Yo — {currentUser.email}
          </option>
        )}
        {teams.length > 0 && (
          <optgroup label="Miembros de equipos">
            {personOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} ({p.teamName})
              </option>
            ))}
          </optgroup>
        )}
        {!valueInOptions && hasValue && (
          <option value={value} disabled>
            {value} (valor actual — no encontrado en equipos)
          </option>
        )}
      </select>
    </div>
  )
}
