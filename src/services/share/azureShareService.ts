import { getAzureConfig as _getBackupConfig, saveAzureConfig as _saveBackupConfig, clearAzureConfig } from '@/services/backup/azureBackupService'
import { encryptData, decryptData, isEncryptedPayload } from '@/services/share/encryptionService'
export const getAzureBackupConfig = _getBackupConfig
export const saveAzureBackupConfig = _saveBackupConfig
export { clearAzureConfig }

// ─── Sharing-specific Azure config (separate from backup) ──────────────

const SHARE_CONFIG_KEY = 'tgp-azure-share-config'

export interface AzureShareConfig {
  sasUrl: string
  containerName: string
}

export function getShareAzureConfig(): AzureShareConfig | null {
  try {
    const raw = localStorage.getItem(SHARE_CONFIG_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AzureShareConfig
  } catch {
    return null
  }
}

export function saveShareAzureConfig(config: AzureShareConfig): void {
  localStorage.setItem(SHARE_CONFIG_KEY, JSON.stringify(config))
}

export function clearShareAzureConfig(): void {
  localStorage.removeItem(SHARE_CONFIG_KEY)
}

export function getShareAzureInfo(): { configured: boolean; containerName: string } {
  const config = getShareAzureConfig()
  return {
    configured: config !== null && config.sasUrl.length > 0 && config.containerName.length > 0,
    containerName: config?.containerName ?? '',
  }
}

// ─── Which config to use for sharing? ────────────────────────────────

function getEffectiveShareConfig(): { sasUrl: string; containerName: string } | null {
  // Prefer dedicated share config, fall back to backup config
  const share = getShareAzureConfig()
  if (share) return share
  const backup = getAzureBackupConfig()
  if (backup) return backup
  return null
}

// ─── Base64 helpers ─────────────────────────────────────────────────

function enc(t: string): string { return btoa(t).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '') }
function dec(s: string): string {
  const p = s.length % 4 === 3 ? '=' : s.length % 4 === 2 ? '==' : ''
  return atob(s.replace(/-/g, '+').replace(/_/g, '/') + p)
}

// ─── Manifest types ──────────────────────────────────────────────────
// v1: [version, encodedSasUrl, container, filename]
// v2: [version, encodedSasUrl, container, filename, autoKey?]

type ManifestV1 = [number, string, string, string]
type ManifestV2 = [number, string, string, string, string | undefined]
type Manifest = ManifestV1 | ManifestV2

const MANIFEST_VERSION = 2

// ─── Auto-encryption helpers ────────────────────────────────────────

function generateAutoKey(): string {
  const buf = new Uint8Array(16)
  crypto.getRandomValues(buf)
  return Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join('')
}

// ─── URL builders ───────────────────────────────────────────────────

function buildBlobUrl(sasUrl: string, container: string, filename: string): string {
  const qi = sasUrl.indexOf('?')
  const params = qi >= 0 ? sasUrl.substring(qi) : ''
  const base = qi >= 0 ? sasUrl.substring(0, qi) : sasUrl
  const u = new URL(base)
  return `${u.protocol}//${u.hostname}/${container}/${filename}${params}`
}

// ─── Upload ──────────────────────────────────────────────────────────

export async function uploadShareToAzure(hash: string, data: unknown): Promise<{ url: string | null; autoKey?: string }> {
  const cfg = getEffectiveShareConfig()
  if (!cfg?.sasUrl || !cfg.containerName) return { url: null }

  // ALWAYS encrypt data at rest in Azure when sharing
  // If data is already encrypted (user provided a passphrase), we still wrap it
  // in a second layer of encryption so data at rest is always protected
  const autoKey = generateAutoKey()
  const encryptedPayload = await encryptData(data, autoKey)
  const finalData = isEncryptedPayload(data)
    ? await encryptData(encryptedPayload, autoKey) // double-encrypt: passphrase + auto
    : encryptedPayload                              // single-encrypt: auto only

  const filename = `d${hash.slice(0, 16)}.json`
  const url = buildBlobUrl(cfg.sasUrl, cfg.containerName, filename)

  try {
    const r = await fetch(url, {
      method: 'PUT',
      body: JSON.stringify(finalData),
      headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': 'application/json' },
    })
    return { url: r.ok ? url : null, autoKey }
  } catch {
    return { url: null, autoKey }
  }
}

// ─── Download helpers ───────────────────────────────────────────────

export async function downloadShareFromAzure(hash: string): Promise<unknown | null> {
  const cfg = getEffectiveShareConfig()
  if (!cfg?.sasUrl || !cfg.containerName) return null
  const url = buildBlobUrl(cfg.sasUrl, cfg.containerName, `d${hash.slice(0, 16)}.json`)
  try {
    const r = await fetch(url)
    return r.ok ? r.json() : null
  } catch {
    return null
  }
}

export async function downloadUsingManifest(m: string): Promise<unknown | null> {
  try {
    const parsed: Manifest = JSON.parse(m)
    const [v, es, c, f] = parsed

    if (v !== 1 && v !== 2) return null

    const sasUrl = dec(es)
    if (!sasUrl.startsWith('https://')) return null

    const blobUrl = buildBlobUrl(sasUrl, c, f)
    const resp = await fetch(blobUrl)
    if (!resp.ok) return null

    const rawData = await resp.json()

    // v2 auto-decrypt if autoKey present
    if (v === 2 && parsed.length >= 5) {
      const autoKey = parsed[4]
      if (autoKey) {
        if (isEncryptedPayload(rawData)) {
          const inner = await decryptData(rawData, autoKey)
          if (!inner) return null
          // Check if inner is also encrypted (double-encrypt: passphrase + auto)
          if (isEncryptedPayload(inner)) return inner // still needs passphrase
          return inner
        }
      }
    }

    return rawData
  } catch {
    return null
  }
}

// ─── Manifest builder ───────────────────────────────────────────────

export function buildManifestString(hash: string, autoKey?: string): string | null {
  const cfg = getEffectiveShareConfig()
  if (!cfg?.sasUrl || !cfg.containerName) return null

  if (autoKey) {
    return JSON.stringify([MANIFEST_VERSION, enc(cfg.sasUrl), cfg.containerName, `d${hash.slice(0, 16)}.json`, autoKey])
  }
  // v1 fallback (no autoKey — shouldn't happen after this refactor but keep for BC)
  return JSON.stringify([1, enc(cfg.sasUrl), cfg.containerName, `d${hash.slice(0, 16)}.json`])
}

// ─── Azure container management ─────────────────────────────────────

export async function listShareContainerBlobs(): Promise<string[]> {
  const cfg = getEffectiveShareConfig()
  if (!cfg?.sasUrl || !cfg.containerName) return []

  const { ContainerClient } = await import('@azure/storage-blob')
  const qi = cfg.sasUrl.indexOf('?')
  const sasParams = qi >= 0 ? cfg.sasUrl.substring(qi) : ''
  const baseUrl = cfg.sasUrl.substring(0, qi)
  const urlObj = new URL(baseUrl)
  const containerUrl = `${urlObj.protocol}//${urlObj.hostname}/${cfg.containerName}${sasParams}`
  const client = new ContainerClient(containerUrl)

  const blobs: string[] = []
  try {
    const iter = client.listBlobsFlat()
    for await (const blob of iter) {
      blobs.push(blob.name)
    }
  } catch { /* noop */ }

  return blobs
}

export async function deleteShareBlob(filename: string): Promise<boolean> {
  const cfg = getEffectiveShareConfig()
  if (!cfg?.sasUrl || !cfg.containerName) return false

  const qi = cfg.sasUrl.indexOf('?')
  const params = qi >= 0 ? cfg.sasUrl.substring(qi) : ''
  const base = qi >= 0 ? cfg.sasUrl.substring(0, qi) : cfg.sasUrl
  const u = new URL(base)
  const url = `${u.protocol}//${u.hostname}/${cfg.containerName}/${filename}${params}`

  try {
    const r = await fetch(url, { method: 'DELETE' })
    return r.ok
  } catch {
    return false
  }
}
