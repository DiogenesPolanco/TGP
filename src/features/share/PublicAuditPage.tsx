import { useParams } from 'react-router-dom'
import { usePublicShare } from '@/hooks/usePublicShare'
import { getPublicAuditData } from '@/services/share/publicShareService'
import { PassphraseModal } from '@/components/sharing/PassphraseModal'
import { InvalidLinkPage } from '@/components/sharing/InvalidLinkPage'
import { SortableTable, type Column } from '@/components/ui/SortableTable'
import { ClipboardCheck } from 'lucide-react'

type AuditRow = Record<string, unknown> & {
  id: string
  title: string
  status: string
  applicationId?: string
  dueDate?: string
}

export function PublicAuditPage() {
  const { hash } = useParams<{ hash: string }>()
  const { loading, valid, data, pendingEncrypted, handleDecrypt } = usePublicShare(hash, () =>
    getPublicAuditData(),
  )

  const appMap = new Map(
    (data?.applications as Array<Record<string, unknown>>)?.map((a) => [
      a.id as string,
      a.name as string,
    ]) ?? [],
  )

  const columns: Column<AuditRow>[] = [
    {
      key: 'title',
      label: 'Hallazgo',
      sortable: true,
      render: (v) => <span className="font-medium text-neutral-90 dark:text-white">{v.title}</span>,
    },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      render: (v) => {
        const c =
          v.status === 'resolved'
            ? 'text-success bg-success/10'
            : v.status === 'in_progress'
              ? 'text-warning bg-warning/10'
              : 'text-danger bg-danger/10'
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${c}`}
          >
            {v.status.replace(/_/g, ' ')}
          </span>
        )
      },
    },
    {
      key: 'applicationId',
      label: 'Aplicación',
      sortable: true,
      render: (v) => (
        <span className="text-secondary">{appMap.get(v.applicationId ?? '') ?? '—'}</span>
      ),
    },
    {
      key: 'dueDate',
      label: 'Vencimiento',
      sortable: true,
      render: (v) => (
        <span className="text-muted">
          {v.dueDate ? new Date(v.dueDate).toLocaleDateString() : '—'}
        </span>
      ),
    },
  ]

  if (loading)
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  if (!valid) return <InvalidLinkPage />
  if (!data) {
    if (pendingEncrypted) {
      return (
        <div className="min-h-screen bg-canvas flex items-center justify-center">
          <PassphraseModal
            title="Hallazgos de auditoría protegidos"
            description="Esta vista fue compartida con cifrado. Ingresa la contraseña para verla."
            onSubmit={async (pass) => {
              const ok = await handleDecrypt(pass)
              if (!ok) alert('Contraseña incorrecta')
            }}
          />
        </div>
      )
    }
    return null
  }

  const findings = data.findings as AuditRow[]

  return (
    <div id="printable-content" className="min-h-screen bg-canvas">
      <header className="bg-card border-b border-boundary">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-sm">
              <img src="/favicon.svg" alt="TGP" className="w-full h-full" />
            </div>
            <div>
              <h1 className="text-base font-bold text-neutral-90 dark:text-white">Auditoría</h1>
              <p className="text-xs text-neutral-50">Vista compartida · Solo lectura</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 py-8 max-w-screen-2xl mx-auto">
        <div className="bg-card rounded-2xl border border-boundary shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-boundary flex items-center gap-2">
            <ClipboardCheck size={18} className="text-info" />
            <span className="font-semibold text-neutral-90 dark:text-white">
              {findings.length} hallazgos compartidos
            </span>
          </div>
          <SortableTable columns={columns} data={findings} pageSize={25} />
        </div>

        <div className="text-center text-xs text-neutral-40 py-4 border-t border-boundary mt-6">
          TGP — Technology Governance Platform · Datos compartidos
        </div>
      </main>
    </div>
  )
}
