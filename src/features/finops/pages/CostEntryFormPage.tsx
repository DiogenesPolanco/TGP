import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { db } from '@/services/db/database'
import { createCostEntry, getCostEntry, updateCostEntry } from '../services/finOpsService'
import { useCatalog } from '@/hooks/useCatalog'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

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

type FormValues = z.input<typeof schema>
type FormOutput = z.output<typeof schema>

export function CostEntryFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const editing = Boolean(id)

  const categories = useCatalog('cost_category')
  const apps = useLiveQuery(() => db.applications.toArray()) ?? []
  const entry = useLiveQuery(() => (id ? getCostEntry(id) : undefined), [id])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { source: 'manual', currency: 'USD' },
  })
  const selectedApp = watch('applicationId')
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
      setValue('applicationId', entry.applicationId)
      setValue('microserviceId', entry.microserviceId ?? '')
      setValue('categoryId', entry.categoryId)
      setValue('amount', entry.amount)
      setValue('currency', entry.currency)
      setValue('period', entry.period)
      setValue('source', entry.source)
      setValue('notes', entry.notes ?? '')
    }
  }, [entry, setValue])

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
    if (editing && id) await updateCostEntry(id, payload)
    else await createCostEntry(payload)
    navigate('/finops/entries')
  }

  return (
    <div className="p-6 max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">{editing ? 'Editar partida' : 'Nueva partida'}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Aplicación *</label>
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

        {selectedApp && (
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">
              Microservicio (opcional)
            </label>
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
          <label className="block text-sm font-medium text-secondary mb-1">Categoría *</label>
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
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Monto (USD) *</label>
          <input
            type="number"
            step="0.01"
            min={0}
            {...register('amount')}
            className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {errors.amount && <p className="text-xs text-danger mt-1">{errors.amount.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-1">
            Periodo (YYYY-MM) *
          </label>
          <input
            type="month"
            {...register('period')}
            className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {errors.period && <p className="text-xs text-danger mt-1">{errors.period.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Notas</label>
          <textarea
            rows={3}
            {...register('notes')}
            className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <Button type="submit">{editing ? 'Guardar cambios' : 'Crear partida'}</Button>
      </form>
    </div>
  )
}
