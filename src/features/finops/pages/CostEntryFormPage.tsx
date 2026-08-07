import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Building2,
  CalendarDays,
  CircleDollarSign,
  Coins,
  StickyNote,
  Tag,
  Type,
} from 'lucide-react'
import { db } from '@/services/db/database'
import {
  createCostEntry,
  getCostEntry,
  updateCostEntry,
  getAppCost,
  getCostBudgets,
} from '../services/finOpsService'
import { useCatalog } from '@/hooks/useCatalog'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { DetailLayout } from '@/components/ui/DetailLayout'
import { useAppStore } from '@/stores/appStore'
import { CostCategoryBadge } from '../components/CostCategoryBadge'

const schema = z.object({
  applicationId: z.string().min(1, 'Selecciona una aplicación'),
  microserviceId: z.string().optional(),
  categoryId: z.string().min(1, 'Selecciona una categoría'),
  amount: z.coerce.number().positive('Monto debe ser mayor a 0'),
  currency: z.string().default('USD'),
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Periodo en formato YYYY-MM'),
  source: z.enum(['manual', 'allocation', 'import']).default('manual'),
  notes: z.string().optional(),
})

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Manual',
  allocation: 'Distribución',
  import: 'Importación',
}

type FormValues = z.input<typeof schema>
type FormOutput = z.output<typeof schema>

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20'

function FieldLabel({
  icon,
  children,
  required,
}: {
  icon?: React.ReactNode
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs font-medium text-muted mb-1">
      {icon}
      {children}
      {required && <span className="text-danger ml-0.5">*</span>}
    </label>
  )
}

export function CostEntryFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addNotification } = useAppStore()
  const editing = Boolean(id)

  const categories = useCatalog('cost_category')
  const apps = useLiveQuery(() => db.applications.toArray()) ?? []
  const entry = useLiveQuery(() => (id ? getCostEntry(id) : undefined), [id])

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { source: 'manual', currency: 'USD' },
  })

  const selectedApp = watch('applicationId')
  const selectedPeriod = watch('period')
  const [microservices, setMicroservices] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    if (!selectedApp) {
      setMicroservices([])
      return
    }
    db.microservices
      .where('applicationId')
      .equals(selectedApp)
      .toArray()
      .then((m) => setMicroservices(m.map((x) => ({ id: x.id, name: x.name }))))
  }, [selectedApp])

  useEffect(() => {
    if (entry) {
      reset({
        applicationId: entry.applicationId,
        microserviceId: entry.microserviceId ?? '',
        categoryId: entry.categoryId,
        amount: entry.amount,
        currency: entry.currency,
        period: entry.period,
        source: entry.source,
        notes: entry.notes ?? '',
      })
    }
  }, [entry, reset])

  const appCost = useLiveQuery(
    () => (selectedApp && selectedPeriod ? getAppCost(selectedApp, selectedPeriod) : null),
    [selectedApp, selectedPeriod],
  )
  const budgets =
    useLiveQuery(() => (selectedPeriod ? getCostBudgets(selectedPeriod) : []), [selectedPeriod]) ??
    []
  const appBudget = useMemo(
    () => budgets.find((b) => b.applicationId === selectedApp)?.amount ?? null,
    [budgets, selectedApp],
  )

  const categoryLabel = useMemo(
    () => categories.find((c) => c.value === watch('categoryId'))?.label,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [categories, watch('categoryId')],
  )

  const onSubmit = async (values: FormOutput) => {
    const payload = {
      applicationId: values.applicationId,
      microserviceId: values.microserviceId || null,
      categoryId: values.categoryId,
      amount: values.amount,
      currency: values.currency,
      period: values.period,
      source: values.source,
      notes: values.notes ?? null,
    }
    if (editing && id) {
      await updateCostEntry(id, payload)
      addNotification({ type: 'success', message: 'Partida actualizada' })
    } else {
      await createCostEntry(payload)
      addNotification({ type: 'success', message: 'Partida creada' })
    }
    navigate('/finops/entries')
  }

  const fmt = (n: number) =>
    n.toLocaleString('es-ES', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

  const showSummary = Boolean(selectedApp && selectedPeriod)
  const budgetPct = appBudget && appCost ? Math.round((appCost / appBudget) * 100) : null

  return (
    <DetailLayout
      title={editing ? 'Editar partida' : 'Nueva partida'}
      subtitle={
        editing ? 'Actualiza los datos de la partida de costo' : 'Registra una partida de costo'
      }
      onBack={() => navigate('/finops/entries')}
      backLabel="Partidas"
    >
      {showSummary && (
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-boundary bg-neutral-10 dark:bg-neutral-80 p-3.5">
            <p className="text-xs text-muted mb-1">Costo de la app · {selectedPeriod}</p>
            <p className="text-lg font-semibold tabular-nums">
              {appCost != null ? fmt(appCost) : '—'}
            </p>
          </div>
          <div className="rounded-xl border border-boundary bg-neutral-10 dark:bg-neutral-80 p-3.5">
            <p className="text-xs text-muted mb-1">Presupuesto del periodo</p>
            <p className="text-lg font-semibold tabular-nums">
              {appBudget != null ? fmt(appBudget) : 'Sin presupuesto'}
            </p>
          </div>
          <div
            className={`rounded-xl border p-3.5 ${
              budgetPct != null && budgetPct > 90
                ? 'border-danger/40 bg-danger/5'
                : 'border-boundary bg-neutral-10 dark:bg-neutral-80'
            }`}
          >
            <p className="text-xs text-muted mb-1">Uso del presupuesto</p>
            <p className="text-lg font-semibold tabular-nums">
              {budgetPct != null ? `${budgetPct}%` : '—'}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
          <div>
            <FieldLabel icon={<Building2 size={13} />} required>
              Aplicación
            </FieldLabel>
            <Controller
              name="applicationId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  options={apps.map((a) => ({ value: a.id, label: a.name }))}
                  placeholder="Selecciona una aplicación"
                />
              )}
            />
            {errors.applicationId && (
              <p className="text-xs text-danger mt-1">{errors.applicationId.message}</p>
            )}
          </div>

          <div>
            <FieldLabel icon={<CalendarDays size={13} />} required>
              Periodo (YYYY-MM)
            </FieldLabel>
            <input type="month" {...register('period')} className={inputCls} />
            {errors.period && <p className="text-xs text-danger mt-1">{errors.period.message}</p>}
          </div>

          {selectedApp && (
            <div>
              <FieldLabel icon={<CircleDollarSign size={13} />}>
                Microservicio (opcional)
              </FieldLabel>
              <Controller
                name="microserviceId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? ''}
                    onChange={(v) => field.onChange(v || '')}
                    options={[
                      { value: '', label: 'Sin microservicio' },
                      ...microservices.map((m) => ({ value: m.id, label: m.name })),
                    ]}
                  />
                )}
              />
            </div>
          )}

          <div>
            <FieldLabel icon={<Tag size={13} />} required>
              Categoría
            </FieldLabel>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  options={categories.map((c) => ({ value: c.value, label: c.label }))}
                  placeholder="Selecciona una categoría"
                />
              )}
            />
            {errors.categoryId && (
              <p className="text-xs text-danger mt-1">{errors.categoryId.message}</p>
            )}
            {watch('categoryId') && categoryLabel && (
              <div className="mt-2">
                <CostCategoryBadge categoryId={watch('categoryId')} label={categoryLabel} />
              </div>
            )}
          </div>

          <div>
            <FieldLabel icon={<Coins size={13} />} required>
              Monto (USD)
            </FieldLabel>
            <input type="number" step="0.01" min={0} {...register('amount')} className={inputCls} />
            {errors.amount && <p className="text-xs text-danger mt-1">{errors.amount.message}</p>}
          </div>

          <div>
            <FieldLabel icon={<Type size={13} />}>Fuente</FieldLabel>
            <Controller
              name="source"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? 'manual'}
                  onChange={field.onChange}
                  options={Object.entries(SOURCE_LABELS).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                />
              )}
            />
          </div>

          <div className="md:col-span-2">
            <FieldLabel icon={<StickyNote size={13} />}>Notas</FieldLabel>
            <textarea
              rows={3}
              {...register('notes')}
              className={`${inputCls} resize-none`}
              placeholder="Contexto adicional de la partida…"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-boundary">
          <Button type="submit" isLoading={isSubmitting}>
            {editing ? 'Guardar cambios' : 'Crear partida'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/finops/entries')}>
            Cancelar
          </Button>
        </div>
      </form>
    </DetailLayout>
  )
}
