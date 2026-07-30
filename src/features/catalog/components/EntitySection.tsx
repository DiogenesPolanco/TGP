import type { EntityType } from '@/features/catalog/components/EntityAssociationList'
import { EntityAssociationList } from '@/features/catalog/components/EntityAssociationList'

export function EntitySection({
  title,
  entityType,
  microserviceId,
}: {
  title: string
  entityType: EntityType
  microserviceId: string
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-neutral-90 dark:text-white">{title}</h2>
      <div className="bg-neutral-5 dark:bg-neutral-85 border border-boundary rounded-xl p-5">
        <EntityAssociationList entityType={entityType} microserviceId={microserviceId} />
      </div>
    </div>
  )
}
