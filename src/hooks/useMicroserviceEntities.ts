import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'

/** Fetch all entity IDs from junction tables for a set of microservice IDs */
export function useInheritedEntityIds(microserviceIds: string[]) {
  const vulnJunctions = useLiveQuery(
    () => microserviceIds.length > 0
      ? db.vulnerabilityMicroservices.where('microserviceId').anyOf(microserviceIds).toArray()
      : [],
    [microserviceIds.join(',')],
  ) ?? []

  const incidentJunctions = useLiveQuery(
    () => microserviceIds.length > 0
      ? db.incidentMicroservices.where('microserviceId').anyOf(microserviceIds).toArray()
      : [],
    [microserviceIds.join(',')],
  ) ?? []

  const auditJunctions = useLiveQuery(
    () => microserviceIds.length > 0
      ? db.auditFindingMicroservices.where('microserviceId').anyOf(microserviceIds).toArray()
      : [],
    [microserviceIds.join(',')],
  ) ?? []

  const riskJunctions = useLiveQuery(
    () => microserviceIds.length > 0
      ? db.riskMicroservices.where('microserviceId').anyOf(microserviceIds).toArray()
      : [],
    [microserviceIds.join(',')],
  ) ?? []

  const databaseJunctions = useLiveQuery(
    () => microserviceIds.length > 0
      ? db.appDatabaseMicroservices.where('microserviceId').anyOf(microserviceIds).toArray()
      : [],
    [microserviceIds.join(',')],
  ) ?? []

  return {
    inheritedVulnIds: new Set(vulnJunctions.map((j) => j.vulnerabilityId)),
    inheritedIncidentIds: new Set(incidentJunctions.map((j) => j.incidentId)),
    inheritedAuditIds: new Set(auditJunctions.map((j) => j.auditFindingId)),
    inheritedRiskIds: new Set(riskJunctions.map((j) => j.riskId)),
    inheritedDatabaseIds: new Set(databaseJunctions.map((j) => j.appDatabaseId)),
  }
}

/** Associate an entity to a microservice */
export async function associateToMicroservice(
  table: 'vulnerabilityMicroservices' | 'incidentMicroservices' | 'auditFindingMicroservices' | 'riskMicroservices' | 'appDatabaseMicroservices',
  entityIdKey: 'vulnerabilityId' | 'incidentId' | 'auditFindingId' | 'riskId' | 'appDatabaseId',
  entityId: string,
  microserviceId: string,
) {
  const existing = await db[table]
    .where({ [entityIdKey]: entityId, microserviceId })
    .first()
  if (existing) return // already exists
  await db[table].add({
    id: crypto.randomUUID(),
    [entityIdKey]: entityId,
    microserviceId,
  } as any)
}

/** Remove association */
export async function dissociateFromMicroservice(
  table: 'vulnerabilityMicroservices' | 'incidentMicroservices' | 'auditFindingMicroservices' | 'riskMicroservices' | 'appDatabaseMicroservices',
  entityIdKey: 'vulnerabilityId' | 'incidentId' | 'auditFindingId' | 'riskId' | 'appDatabaseId',
  entityId: string,
  microserviceId: string,
) {
  const record = await db[table]
    .where({ [entityIdKey]: entityId, microserviceId })
    .first()
  if (record) await db[table].delete(record.id)
}
