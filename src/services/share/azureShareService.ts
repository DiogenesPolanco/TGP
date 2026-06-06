import { ContainerClient } from '@azure/storage-blob'
import { getAzureConfig as _getAzureConfig } from '@/services/backup/azureBackupService'
export const getAzureConfig = _getAzureConfig

const DATA_PREFIX = 'tgp-data-'

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

// ── Manifest: carries Azure config so recipients can access data ──
interface ShareManifest {
  v: number           // version
  s: string           // encrypted SAS URL
  c: string           // container name
  f: string           // data filename (e.g., 'tgp-data-{hash}.json')
}

function buildContainerClient(sasUrl: string, containerName: string): ContainerClient {
  const qIndex = sasUrl.indexOf('?')
  const sasParams = qIndex >= 0 ? sasUrl.substring(qIndex) : ''
  const fullUrl = qIndex >= 0 ? sasUrl.substring(0, qIndex) : sasUrl
  const urlObj = new URL(fullUrl)
  const accountBase = `${urlObj.protocol}//${urlObj.hostname}`
  const containerUrl = `${accountBase}/${containerName}${sasParams}`
  return new ContainerClient(containerUrl)
}

/** Upload dashboard data + manifest to Azure. Returns the data blob URL. */
export async function uploadShareToAzure(
  hash: string,
  data: unknown,
): Promise<string | null> {
  const config = getAzureConfig()
  if (!config?.sasUrl || !config.containerName) return null

  const client = buildContainerClient(config.sasUrl, config.containerName)
  const dataFilename = `${DATA_PREFIX}${hash}.json`
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
  // If no manifest provided, try using viewer's own Azure config
  const viewerConfig = getAzureConfig()
  if (viewerConfig) {
    const client = buildContainerClient(viewerConfig.sasUrl, viewerConfig.containerName)
    try {
      const blobClient = client.getBlockBlobClient(`${DATA_PREFIX}${hash}.json`)
      const resp = await blobClient.download()
      const blob = await resp.blobBody
      if (blob) return JSON.parse(await blob.text())
    } catch { /* data not in viewer's container */ }
  }
  return null
}

/** Download data using a manifest (cross-browser share). */
export async function downloadUsingManifest(manifestStr: string): Promise<unknown | null> {
  try {
    const manifest: ShareManifest = JSON.parse(manifestStr)
    const sasUrl = decrypt(manifest.s)
    const client = buildContainerClient(sasUrl, manifest.c)
    const blobClient = client.getBlockBlobClient(manifest.f)
    const resp = await blobClient.download()
    const blob = await resp.blobBody
    if (!blob) return null
    return JSON.parse(await blob.text())
  } catch {
    return null
  }
}

/** Build an encrypted manifest string that the recipient can use. */
export function buildManifestString(dataFilename: string): string | null {
  const config = getAzureConfig()
  if (!config?.sasUrl || !config.containerName) return null
  const manifest: ShareManifest = {
    v: 1,
    s: encrypt(config.sasUrl),
    c: config.containerName,
    f: dataFilename,
  }
  return JSON.stringify(manifest)
}

/** Parse a manifest string from the URL fragment. */
export function parseManifestString(hashFragment: string): ShareManifest | null {
  try {
    return JSON.parse(hashFragment) as ShareManifest
  } catch {
    return null
  }
}

export function deleteShareFromAzure(_hash: string): Promise<boolean> {
  return Promise.resolve(false)
}
