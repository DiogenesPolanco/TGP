import { ContainerClient } from '@azure/storage-blob'
import { getAzureConfig as _getAzureConfig } from '@/services/backup/azureBackupService'
export const getAzureConfig = _getAzureConfig



// ── Simple XOR cipher for SAS URL obfuscation ──
// Prevents casual exposure in URLs/logs. Not military-grade crypto.
const CIPHER_KEY = 'TGP_SHARE_2026_XOR'

function encrypt(text: string): string {
  let out = ''
  for (let i = 0; i < text.length; i++) {
    out += String.fromCharCode(text.charCodeAt(i) ^ CIPHER_KEY.charCodeAt(i % CIPHER_KEY.length))
  }
  return btoa(out)
}

function decrypt(encoded: string): string {
  const text = atob(encoded)
  let out = ''
  for (let i = 0; i < text.length; i++) {
    out += String.fromCharCode(text.charCodeAt(i) ^ CIPHER_KEY.charCodeAt(i % CIPHER_KEY.length))
  }
  return out
}

// ── Manifest: array format for shorter URLs ──
// [version, encryptedSas, containerName, dataFilename]
type ShareManifest = [number, string, string, string]

function buildContainerClient(sasUrl: string, containerName: string): ContainerClient {
  const qIndex = sasUrl.indexOf('?')
  const sasParams = qIndex >= 0 ? sasUrl.substring(qIndex) : ''
  const fullUrl = qIndex >= 0 ? sasUrl.substring(0, qIndex) : sasUrl
  const urlObj = new URL(fullUrl)
  const accountBase = `${urlObj.protocol}//${urlObj.hostname}`
  const containerUrl = `${accountBase}/${containerName}${sasParams}`
  return new ContainerClient(containerUrl)
}

/** Upload dashboard data to Azure. Returns the blob URL. */
export async function uploadShareToAzure(
  hash: string,
  data: unknown,
): Promise<string | null> {
  const config = getAzureConfig()
  if (!config?.sasUrl || !config.containerName) return null

  const client = buildContainerClient(config.sasUrl, config.containerName)
  const shortHash = hash.slice(0, 16)
  const dataFilename = `d${shortHash}.json`
  const blobClient = client.getBlockBlobClient(dataFilename)
  const json = JSON.stringify(data)

  try {
    await blobClient.upload(json, json.length, {
      blobHTTPHeaders: { blobContentType: 'application/json' },
    })
    return blobClient.url
  } catch (err) {
    console.error('[AzureShare] Error uploading data:', err)
    return null
  }
}

/** Download data from Azure using the config embedded in the URL hash. */
export async function downloadShareFromAzure(
  hash: string,
): Promise<unknown | null> {
  // Try viewer's own Azure config
  const viewerConfig = getAzureConfig()
  if (viewerConfig) {
    const client = buildContainerClient(viewerConfig.sasUrl, viewerConfig.containerName)
    const shortHash = hash.slice(0, 16)
    try {
      const blobClient = client.getBlockBlobClient(`d${shortHash}.json`)
      const resp = await blobClient.download()
      const blob = await resp.blobBody
      if (blob) return JSON.parse(await blob.text())
    } catch { /* data not in viewer's container */ }
  }
  return null
}

/** Download data using a manifest from the URL fragment. */
export async function downloadUsingManifest(manifestStr: string): Promise<unknown | null> {
  try {
    const [version, encryptedSas, containerName, dataFilename]: ShareManifest = JSON.parse(manifestStr)
    if (version !== 1) return null
    const sasUrl = decrypt(encryptedSas)
    const client = buildContainerClient(sasUrl, containerName)
    const blobClient = client.getBlockBlobClient(dataFilename)
    const resp = await blobClient.download()
    const blob = await resp.blobBody
    if (!blob) return null
    return JSON.parse(await blob.text())
  } catch {
    return null
  }
}

/** Build an encrypted manifest array for the URL fragment (compact format). */
export function buildManifestString(hash: string): string | null {
  const config = getAzureConfig()
  if (!config?.sasUrl || !config.containerName) return null
  const shortHash = hash.slice(0, 16)
  const manifest: ShareManifest = [1, encrypt(config.sasUrl), config.containerName, `d${shortHash}.json`]
  return JSON.stringify(manifest)
}

export function deleteShareFromAzure(_hash: string): Promise<boolean> {
  return Promise.resolve(false)
}
