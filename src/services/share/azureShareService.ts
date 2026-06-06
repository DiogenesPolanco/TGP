import { ContainerClient } from '@azure/storage-blob'
import { getAzureConfig } from '@/services/backup/azureBackupService'

const SHARE_PREFIX = 'tgp-share-'

function getShareClient(): ContainerClient | null {
  const config = getAzureConfig()
  if (!config?.sasUrl || !config.containerName) return null

  const qIndex = config.sasUrl.indexOf('?')
  const sasParams = qIndex >= 0 ? config.sasUrl.substring(qIndex) : ''
  const fullUrl = qIndex >= 0 ? config.sasUrl.substring(0, qIndex) : config.sasUrl
  const urlObj = new URL(fullUrl)
  const accountBase = `${urlObj.protocol}//${urlObj.hostname}`
  const containerUrl = `${accountBase}/${config.containerName}${sasParams}`
  return new ContainerClient(containerUrl)
}

export async function uploadShareToAzure(
  hash: string,
  data: unknown,
): Promise<string | null> {
  const client = getShareClient()
  if (!client) return null

  const blobName = `${SHARE_PREFIX}${hash}.json`
  const blockBlobClient = client.getBlockBlobClient(blobName)
  const json = JSON.stringify(data)

  try {
    await blockBlobClient.upload(json, json.length, {
      blobHTTPHeaders: { blobContentType: 'application/json' },
    })
    return blockBlobClient.url
  } catch (err) {
    console.error('[AzureShare] Error uploading:', err)
    return null
  }
}

export async function downloadShareFromAzure(
  hash: string,
): Promise<unknown | null> {
  const client = getShareClient()
  if (!client) return null

  const blobName = `${SHARE_PREFIX}${hash}.json`
  const blockBlobClient = client.getBlockBlobClient(blobName)

  try {
    const response = await blockBlobClient.download()
    const blob = await response.blobBody
    if (!blob) return null
    const text = await blob.text()
    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function deleteShareFromAzure(hash: string): Promise<boolean> {
  const client = getShareClient()
  if (!client) return false

  const blobName = `${SHARE_PREFIX}${hash}.json`
  const blockBlobClient = client.getBlockBlobClient(blobName)

  try {
    await blockBlobClient.delete()
    return true
  } catch {
    return false
  }
}

export function isAzureShareConfigured(): boolean {
  return getAzureConfig() !== null
}
