import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { useConfirm } from '@/hooks/useConfirm'
import { SortableTable, type Column } from '@/components/ui/SortableTable'
import { Button } from '@/components/ui/Button';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import type { User } from '@/types/domain'

const roleLabel: Record<string, string> = { admin: 'Admin', executive: 'Ejecutivo', manager: 'Manager', operator: 'Operador' }

export function UsersPage() {
  const navigate = useNavigate()
  const { confirm } = useConfirm()
  const { addNotification } = useAppStore()
  const [search, setSearch] = useState('')

  const users = useLiveQuery(() => db.users.toArray()) ?? []

  const filtered = users.filter((u) =>
    u.displayName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (user: User) => {
    if (!(await confirm(`Eliminar usuario "${user.displayName}"?`))) return
    await db.users.delete(user.id)
    addNotification({ type: 'success', message: 'Usuario eliminado' })
  }

  const columns: Column<User>[] = [
    { key: 'displayName', label: 'Nombre', sortable: true, render: (u) => <span className="text-sm font-medium text-neutral-90 dark:text-white">{u.displayName}</span> },
    { key: 'email', label: 'Email', sortable: true, render: (u) => <span className="text-sm text-secondary">{u.email}</span> },
    { key: 'role', label: 'Rol', sortable: true, render: (u) => {
      const colors: Record<string, string> = { admin: 'bg-danger/10 text-danger', executive: 'bg-warning/10 text-warning', manager: 'bg-info/10 text-info', operator: 'bg-success/10 text-success' }
      return <span className={`text-xs px-2 py-0.5 rounded-full ${colors[u.role] || 'bg-neutral-10 text-neutral-60'}`}>{roleLabel[u.role] ?? u.role}</span>
    }},
    { key: 'isActive', label: 'Estado', sortable: true, render: (u) => (
      <span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
        {u.isActive ? 'Activo' : 'Inactivo'}
      </span>
    )},
    { key: 'createdAt', label: 'Creado', sortable: true, render: (u) => <span className="text-sm text-neutral-50">{new Date(u.createdAt).toLocaleDateString('es-ES')}</span> },
    { key: 'actions', label: '', render: (u) => (
      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all" onClick={(e) => e.stopPropagation()}>
        <Button onClick={() => navigate(`/admin/users/${u.id}/edit`)} variant="ghost" size="sm" className="p-1.5" title="Editar"><Pencil size={14} /></Button>
        <Button onClick={() => handleDelete(u)} variant="ghost" size="sm" className="p-1.5 text-neutral-50 hover:text-danger" title="Eliminar"><Trash2 size={14} /></Button>
      </div>
    ), className: 'text-right w-20' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-lg font-semibold text-neutral-90 dark:text-white">Usuarios</h2>
            <p className="text-xs text-muted mt-0.5">Gestión de usuarios del sistema</p>
          </div>
          <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            {filtered.length}
          </span>
        </div>
        <Button onClick={() => navigate('/admin/users/new')} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
          <Plus size={18} /> Nuevo Usuario
        </Button>
      </div>

      <div className="bg-card rounded-2xl border border-boundary p-4 shadow-sm">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
          <input type="text" placeholder="Buscar por nombre o email..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
      </div>

      <SortableTable
        columns={columns}
        data={filtered}
        onRowClick={(u) => navigate(`/admin/users/${u.id}/edit`)}
        emptyMessage="No se encontraron usuarios"
      />
    </div>
  )
}
