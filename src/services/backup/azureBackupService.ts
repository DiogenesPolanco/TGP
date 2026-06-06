import { ContainerClient } from '@azure/storage-blob'
import {
  exportDatabase,
  dateReviver,
  importBackup,
} from '@/services/export/exportService'
import type { DatabaseBackup } from '@/services/export/exportService'

const CONFIG_KEY = 'tgp-azure-backup'
const LAST_BACKUP_KEY = 'tgp-azure-last-backup'

export interface AzureBackupConfig {
  sasUrl: string
  containerName: string
}

export interface BackupBlobInfo {
  name: string
  size: number
  lastModified: string
}

export interface AzureBackupInfo {
  configured: boolean
  containerName: string
  lastBackup: string | null
  lastBackupName: string | null
}

export function getAzureConfig(): AzureBackupConfig | null {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AzureBackupConfig
  } catch {
    return null
  }
}

export function saveAzureConfig(config: AzureBackupConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
  localStorage.removeItem(LAST_BACKUP_KEY)
}

export function clearAzureConfig(): void {
  localStorage.removeItem(CONFIG_KEY)
  localStorage.removeItem(LAST_BACKUP_KEY)
}

export function getAzureBackupInfo(): AzureBackupInfo {
  const config = getAzureConfig()
  const lastRaw = localStorage.getItem(LAST_BACKUP_KEY)
  let lastBackup: string | null = null
  let lastBackupName: string | null = null
  if (lastRaw) {
    try {
      const parsed = JSON.parse(lastRaw) as { date: string; name: string }
      lastBackup = parsed.date
      lastBackupName = parsed.name
    } catch { /* empty */
    }
  }
  return {
    configured: config !== null && config.sasUrl.length > 0 && config.containerName.length > 0,
    containerName: config?.containerName ?? '',
    lastBackup,
    lastBackupName,
  }
}

function getClient(): ContainerClient {
  const config = getAzureConfig()
  if (!config?.sasUrl) throw new Error('Azure Backup no configurado')
  if (!config.containerName) throw new Error('Nombre del contenedor no configurado')

  const qIndex = config.sasUrl.indexOf('?')
  const sasParams = qIndex >= 0 ? config.sasUrl.substring(qIndex) : ''

  // Strip everything to get just the account base URL
  const fullUrl = qIndex >= 0 ? config.sasUrl.substring(0, qIndex) : config.sasUrl
  const urlObj = new URL(fullUrl)
  const accountBase = `${urlObj.protocol}//${urlObj.hostname}`

  // Always construct: accountBase/containerName?sasParams
  const containerUrl = `${accountBase}/${config.containerName}${sasParams}`
  return new ContainerClient(containerUrl)
}

export async function testAzureConnection(): Promise<{
  success: boolean
  message: string
}> {
  try {
    const client = getClient()
    const iterator = client.listBlobsFlat()
    await iterator.next()
    return { success: true, message: 'Conexión exitosa con Azure Blob Storage' }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return { success: false, message: `Error de conexión: ${msg}` }
  }
}

export async function uploadBackupToAzure(): Promise<{
  blobName: string
  sizeBytes: number
}> {
  const config = getAzureConfig()
  if (!config?.sasUrl) throw new Error('Azure Backup no configurado')

  const backup = await exportDatabase()
  const json = JSON.stringify(backup, dateReviver)
  const sizeBytes = new TextEncoder().encode(json).length

  const dateStr = new Date().toISOString().split('T')[0]
  const blobName = `tgp-backup-${dateStr}.json`

  const client = getClient()
  const blockBlobClient = client.getBlockBlobClient(blobName)
  await blockBlobClient.upload(json, json.length, {
    blobHTTPHeaders: { blobContentType: 'application/json' },
  })

  localStorage.setItem(
    LAST_BACKUP_KEY,
    JSON.stringify({ date: new Date().toISOString(), name: blobName }),
  )

  return { blobName, sizeBytes }
}

export async function listAzureBackups(): Promise<BackupBlobInfo[]> {
  const client = getClient()
  const blobs: BackupBlobInfo[] = []

  for await (const blob of client.listBlobsFlat()) {
    blobs.push({
      name: blob.name,
      size: blob.properties.contentLength ?? 0,
      lastModified: blob.properties.lastModified?.toISOString() ?? '',
    })
  }

  return blobs.sort((a, b) => b.lastModified.localeCompare(a.lastModified))
}

export async function downloadBackupFromAzure(
  blobName: string,
): Promise<DatabaseBackup> {
  const client = getClient()
  const blockBlobClient = client.getBlockBlobClient(blobName)

  const response = await blockBlobClient.download()
  const blob = await response.blobBody
  if (!blob) throw new Error('No se pudo descargar el archivo de Azure')

  const text = await blob.text()
  return JSON.parse(text) as DatabaseBackup
}

export async function restoreFromAzure(
  blobName: string,
): Promise<{
  success: boolean
  tablesRestored: string[]
  tablesWithErrors: string[]
  totalRecords: number
  errors: string[]
}> {
  const backup = await downloadBackupFromAzure(blobName)
  return await importBackup(backup)
}
