import { useParams } from 'react-router-dom'
import { usePublicShare } from '@/hooks/usePublicShare'
import { getPublicIncidentsData, type PublicIncidentsData } from '@/services/share/publicShareService'
import { PassphraseModal } from '@/components/sharing/PassphraseModal'
import { InvalidLinkPage } from '@/components/sharing/InvalidLinkPage'
import { SortableTable, type Column } from '@/components/ui/SortableTable'
import { AlertTriangle } from 'lucide-react'

const sevColors: Record<string, string> = {
  p1: 'text-danger bg-danger/10',
  p2: 'text-warning bg-warning/10',
  p3: 'text-info bg-info/10',
  p4: 'text-neutral-60 bg-neutral-10 dark:bg-neutral-70',
}

export function PublicIncidentsPage() {
  const { hash } = useParams<{ hash: string }>()
  const { loading, valid, data, pendingEncrypted, handleDecrypt } = usePublicShare(
    hash,
    () => getPublicIncidentsData() as Promise<PublicIncidentsData>,
  )

  const appMap = new Map(data?.applications.map((a) => [a.id, a.name]) ?? [])

  const columns: Column<PublicIncidentsData['incidents'][number] & { id: string }>[] = [
    { key: 'title', label: 'Incidente', sortable: true, render: (v) => <span className="font-medium text-neutral-90 dark:text-white">{v.title}</span> },
    {
      key: 'severity',
      label: 'Severidad',
      sortable: true,
      render: (v) => (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${sevColors[v.severity] ?? sevColors.p4}`}>
          {v.severity.toUpperCase()}
        </span>
      ),
    },
    { key: 'responseTime', label: 'Tiempo Respuesta', sortable: true, className: 'text-right', render: (v) => <span className="text-muted">{v.responseTime ? `${v.responseTime}h` : '—'}</span> },
    { key: 'resolutionTime', label: 'Tiempo Resolución', sortable: true, className: 'text-right', render: (v) => <span className="text-muted">{v.resolutionTime ? `${v.resolutionTime}h` : '—'}</span> },
    {
      key: 'applicationId',
      label: 'Aplicación',
      sortable: true,
      render: (v) => <span className="text-secondary">{appMap.get(v.applicationId) ?? '—'}</span>,
    },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      render: (v) => {
        const c = v.status === 'resolved' ? 'text-success bg-success/10' : v.status === 'in_progress' ? 'text-warning bg-warning/10' : 'text-danger bg-danger/10'
        return <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${c}`}>{v.status.replace(/_/g, ' ')}</span>
      },
    },
  ]

  if (loading) return <div className="min-h-screen bg-canvas flex items-center justify-center"><div className="w-8 h-8 border-2 border-neutral-30 border-t-primary rounded-full animate-spin" /></div>
  if (!valid) return <InvalidLinkPage />
  if (!data) {
    if (pendingEncrypted) {
      return (
        <div className="min-h-screen bg-canvas flex items-center justify-center">
          <PassphraseModal
            title="Incidentes protegidos"
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

  return (
    <div id="printable-content" className="min-h-screen bg-canvas">
      <header className="bg-card border-b border-boundary">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-sm">
              <img src="/favicon.svg" alt="TGP" className="w-full h-full" />
            </div>
            <div>
              <h1 className="text-base font-bold text-neutral-90 dark:text-white">Incidentes</h1>
              <p className="text-xs text-neutral-50">Vista compartida · Solo lectura</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 py-8 max-w-screen-2xl mx-auto">
        <div className="bg-card rounded-2xl border border-boundary shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-boundary flex items-center gap-2">
            <AlertTriangle size={18} className="text-warning" />
            <span className="font-semibold text-neutral-90 dark:text-white">{data.incidents.length} incidentes compartidos</span>
          </div>
          <SortableTable
            columns={columns}
            data={data.incidents.map((v) => ({ ...v, id: v.id }))}
            pageSize={25}
          />
        </div>

        <div className="text-center text-xs text-neutral-40 py-4 border-t border-boundary mt-6">
          TGP — Technology Governance Platform · Datos compartidos
        </div>
      </main>
    </div>
  )
}
