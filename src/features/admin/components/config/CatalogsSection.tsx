import { useState, useEffect } from 'react'
import { List, Plus, Save, X, RefreshCw } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { useConfirm } from '@/hooks/useConfirm'
import {
  getCatalog,
  getAllCategories,
  upsertCatalogEntry,
  deleteCatalogEntry,
} from '@/services/system/catalogService'
import type { CatalogEntry } from '@/types/system'
import { Button } from '@/components/ui/Button'

export function CatalogsSection() {
  const { addNotification } = useAppStore()
  const { confirm } = useConfirm()
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCat, setSelectedCat] = useState<string>('')
  const [entries, setEntries] = useState<CatalogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [newValue, setNewValue] = useState('')
  const [newLabel, setNewLabel] = useState('')

  const loadCategories = async () => {
    const cats = await getAllCategories()
    setCategories(cats)
    if (!selectedCat && cats.length > 0) setSelectedCat(cats[0])
  }

  const loadEntries = async (cat: string) => {
    if (!cat) return
    setLoading(true)
    const items = await getCatalog(cat)
    setEntries(items)
    setLoading(false)
  }

  useEffect(() => {
    loadCategories()
  }, [])
  useEffect(() => {
    loadEntries(selectedCat)
  }, [selectedCat])

  const handleEdit = async (id: string) => {
    if (!editLabel.trim()) return
    await upsertCatalogEntry(id, {
      category: selectedCat,
      value: entries.find((e) => e.id === id)?.value ?? '',
      label: editLabel.trim(),
      sortOrder: entries.find((e) => e.id === id)?.sortOrder ?? 0,
      enabled: true,
    })
    addNotification({ type: 'success', message: 'Label actualizado' })
    setEditingId(null)
    await loadEntries(selectedCat)
  }

  const handleAdd = async () => {
    if (!newValue.trim() || !newLabel.trim()) return
    await upsertCatalogEntry(undefined, {
      category: selectedCat,
      value: newValue.trim(),
      label: newLabel.trim(),
      sortOrder: entries.length,
      enabled: true,
    })
    addNotification({ type: 'success', message: `"${newLabel}" agregado` })
    setNewValue('')
    setNewLabel('')
    setShowNew(false)
    await loadEntries(selectedCat)
  }

  const handleDelete = async (id: string, label: string) => {
    if (!(await confirm(`¿Eliminar "${label}" del catálogo?`))) return
    await deleteCatalogEntry(id)
    addNotification({ type: 'success', message: 'Eliminado' })
    await loadEntries(selectedCat)
  }

  const handleToggle = async (entry: CatalogEntry) => {
    await upsertCatalogEntry(entry.id, {
      category: entry.category,
      value: entry.value,
      label: entry.label,
      sortOrder: entry.sortOrder,
      enabled: !entry.enabled,
    })
    await loadEntries(selectedCat)
  }

  return (
    <div className="bg-card rounded-2xl border border-boundary shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <List size={18} className="text-primary" />
          <h3 className="text-sm font-bold text-neutral-90 dark:text-white">
            Catálogos del Sistema
          </h3>
        </div>
        <Button
          onClick={() => {
            loadCategories()
            loadEntries(selectedCat)
          }}
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCw size={14} />}
        >
          Recargar
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4 max-h-[120px] overflow-y-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`text-[11px] px-2.5 py-1.5 rounded-full font-medium transition-all ${
              selectedCat === cat
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'bg-neutral-10 dark:bg-neutral-80 text-neutral-60 dark:text-neutral-40 border border-transparent hover:border-neutral-30'
            }`}
          >
            {cat.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {selectedCat ? (
        <>
          <div className="flex items-center justify-between mb-3">
            <code className="text-xs font-mono font-semibold text-neutral-90 dark:text-white">
              {selectedCat.replace(/_/g, ' ')}
              <span className="text-neutral-50 ml-2 font-normal">({entries.length})</span>
            </code>
            <button
              onClick={() => setShowNew(!showNew)}
              className="text-xs text-primary hover:text-primary-dark flex items-center gap-1 font-medium"
            >
              <Plus size={12} /> {showNew ? 'Cancelar' : 'Nuevo'}
            </button>
          </div>

          {showNew && (
            <div className="flex gap-2 mb-3 p-3 rounded-lg border border-primary/20 bg-primary/[0.02]">
              <input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Valor (snake_case)"
                className="flex-1 px-2.5 py-1.5 text-xs rounded border border-neutral-20 dark:border-neutral-60 bg-transparent text-neutral-90 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Label (Español)"
                className="flex-1 px-2.5 py-1.5 text-xs rounded border border-neutral-20 dark:border-neutral-60 bg-transparent text-neutral-90 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
              <button
                onClick={handleAdd}
                disabled={!newValue || !newLabel}
                className="px-3 py-1.5 bg-primary text-white text-xs rounded hover:bg-primary-dark disabled:opacity-50"
              >
                <Save size={12} />
              </button>
            </div>
          )}

          {loading ? (
            <div className="text-xs text-neutral-50 text-center py-6 animate-pulse">
              Cargando...
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto space-y-0.5">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-80/50 group"
                >
                  <button
                    onClick={() => handleToggle(entry)}
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      entry.enabled
                        ? 'bg-primary border-primary'
                        : 'border-neutral-30 dark:border-neutral-60'
                    }`}
                  >
                    {entry.enabled && <span className="text-white text-[8px]">&#10003;</span>}
                  </button>
                  <code className="text-[11px] font-mono text-neutral-60 dark:text-neutral-40 w-[140px] shrink-0 truncate">
                    {entry.value}
                  </code>
                  {editingId === entry.id ? (
                    <div className="flex-1 flex gap-1">
                      <input
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        className="flex-1 px-2 py-1 text-xs rounded border border-primary/30 bg-transparent text-neutral-90 dark:text-white focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEdit(entry.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                      />
                      <button onClick={() => handleEdit(entry.id)} className="text-xs text-primary">
                        <Save size={12} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-xs text-neutral-50"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <span className="flex-1 text-xs text-neutral-90 dark:text-white truncate">
                      {entry.label}
                    </span>
                  )}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => {
                        setEditingId(entry.id)
                        setEditLabel(entry.label)
                      }}
                      className="text-[10px] text-neutral-50 hover:text-primary"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id, entry.label)}
                      className="text-[10px] text-neutral-50 hover:text-danger"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-sm text-neutral-50 text-center py-8">
          Selecciona una categoría para ver sus entradas
        </div>
      )}
    </div>
  )
}
