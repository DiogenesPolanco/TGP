import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useForm, Controller } from 'react-hook-form'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { DetailLayout } from '@/components/ui/DetailLayout'
import type { User } from '@/types/domain'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

interface FormData {
  displayName: string
  email: string
  role: string
  isActive: boolean
  otpRequestIntervalHours: number
}

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'executive', label: 'Ejecutivo' },
  { value: 'manager', label: 'Manager' },
  { value: 'operator', label: 'Operador' },
]

export function UserFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addNotification } = useAppStore()
  const isEdit = !!id

  const user = useLiveQuery(() => (id ? db.users.get(id) : undefined), [id])
  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<FormData>()

  useEffect(() => {
    if (user) {
      reset({ displayName: user.displayName, email: user.email, role: user.role, isActive: user.isActive, otpRequestIntervalHours: user.otpRequestIntervalHours ?? 1 })
    }
  }, [user, reset])

  const onSubmit = async (data: FormData) => {
    if (isEdit) {
      await db.users.update(id!, data as any)
      addNotification({ type: 'success', message: 'Usuario actualizado' })
    } else {
      const existing = await db.users.where('email').equals(data.email).first()
      if (existing) {
        addNotification({ type: 'error', message: 'Ya existe un usuario con ese email' })
        return
      }
      await db.users.add({
        id: crypto.randomUUID(),
        ...data,
        otpRequestIntervalHours: data.otpRequestIntervalHours ?? 1,
        businessUnitIds: [],
        createdAt: new Date(),
      } as User)
      addNotification({ type: 'success', message: 'Usuario creado' })
    }
    navigate('/admin/users')
  }

  return (
    <DetailLayout
      title={isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}
      onBack={() => navigate('/admin/users')}
      backLabel="Usuarios"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-6">
        <div className="space-y-4">
          <div>
            <Label>Nombre completo</Label>
            <input {...register('displayName', { required: 'El nombre es obligatorio' })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            {errors.displayName && <p className="text-xs text-danger mt-1">{errors.displayName.message}</p>}
          </div>
          <div>
            <Label>Email</Label>
            <input type="email" {...register('email', { required: 'El email es obligatorio' })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <Label>Rol</Label>
            <Controller name="role" control={control} render={({ field }) => (
              <Select value={field.value} onChange={(v) => field.onChange(v)} options={roleOptions.map((o) => ({ value: o.value, label: o.label }))} />
            )} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" {...register('isActive')} id="isActive" className="rounded border-neutral-30" />
            <label htmlFor="isActive" className="text-sm text-neutral-90 dark:text-white">Usuario activo</label>
          </div>
          <div>
            <Label>Intervalo OTP (horas)</Label>
            <p className="text-xs text-neutral-50 dark:text-neutral-40 mb-1.5">Tiempo antes de solicitar nuevamente el código OTP</p>
            <input type="number" min={1} max={720} step={1} {...register('otpRequestIntervalHours', { valueAsNumber: true, min: { value: 1, message: 'Mínimo 1 hora' } })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            {errors.otpRequestIntervalHours && <p className="text-xs text-danger mt-1">{errors.otpRequestIntervalHours.message}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3 pt-4 border-t border-boundary">
          <Button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm disabled:opacity-50">
            {isEdit ? 'Guardar Cambios' : 'Crear Usuario'}
          </Button>
          <Button type="button" onClick={() => navigate('/admin/users')}>
            Cancelar
          </Button>
        </div>
      </form>
    </DetailLayout>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-muted mb-1">{children}</label>
}
