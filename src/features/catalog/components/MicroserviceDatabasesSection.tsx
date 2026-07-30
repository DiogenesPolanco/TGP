import { DatabaseAssociationList } from '@/features/catalog/components/DatabaseAssociationList'

interface Props {
  microserviceId: string
  applicationId: string
}

export function MicroserviceDatabasesSection({ microserviceId, applicationId }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-neutral-90 dark:text-white">
        Bases de Datos Asociadas
      </h2>
      <div className="bg-neutral-5 dark:bg-neutral-85 border border-boundary rounded-xl p-5">
        <DatabaseAssociationList microserviceId={microserviceId} applicationId={applicationId} />
      </div>
    </div>
  )
}
