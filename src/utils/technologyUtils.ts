import { db } from '@/services/db/database'

/**
 * Get ALL technology IDs for an application:
 * direct technologies + technologies from all its microservices.
 */
export async function getAppTechnologyIds(appId: string): Promise<string[]> {
  const app = await db.applications.get(appId)
  if (!app) return []

  const microservices = await db.microservices.where('applicationId').equals(appId).toArray()
  const msTechIds = microservices.flatMap((ms) => ms.technologies)

  // Union of direct + inherited, preserve order but deduplicate
  const seen = new Set(app.technologies)
  const all = [...app.technologies]
  for (const techId of msTechIds) {
    if (!seen.has(techId)) {
      seen.add(techId)
      all.push(techId)
    }
  }
  return all
}

/**
 * Given an array of apps and the microservices that belong to them,
 * compute a Map<appId, technologyIds[]> (direct + inherited).
 * Synchronous version for use in memoized hooks.
 */
export function computeAppTechMap(
  apps: { id: string; technologies: string[] }[],
  microservices: { applicationId: string; technologies: string[] }[],
): Map<string, string[]> {
  // Group microservice techs by applicationId
  const msByApp = new Map<string, Set<string>>()
  for (const ms of microservices) {
    let set = msByApp.get(ms.applicationId)
    if (!set) {
      set = new Set()
      msByApp.set(ms.applicationId, set)
    }
    for (const tId of ms.technologies) {
      set.add(tId)
    }
  }

  const result = new Map<string, string[]>()
  for (const app of apps) {
    const seen = new Set(app.technologies)
    const all = [...app.technologies]
    const msTechs = msByApp.get(app.id)
    if (msTechs) {
      for (const techId of msTechs) {
        if (!seen.has(techId)) {
          seen.add(techId)
          all.push(techId)
        }
      }
    }
    result.set(app.id, all)
  }
  return result
}
