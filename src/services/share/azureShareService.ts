import { getAzureConfig as _getAzureConfig } from '@/services/backup/azureBackupService'
export const getAzureConfig = _getAzureConfig

// Simple base64 obfuscation (no cipher key to get out of sync)
function enc(t: string): string { return btoa(t).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,'') }
function dec(s: string): string {
  const p = s.length%4===3?'=':s.length%4===2?'==':''
  return atob(s.replace(/-/g,'+').replace(/_/g,'/')+p)
}

type Manifest = [number, string, string, string]

function buildBlobUrl(sasUrl: string, container: string, filename: string): string {
  const qi = sasUrl.indexOf('?')
  const params = qi >= 0 ? sasUrl.substring(qi) : ''
  const base = qi >= 0 ? sasUrl.substring(0, qi) : sasUrl
  const u = new URL(base)
  return `${u.protocol}//${u.hostname}/${container}/${filename}${params}`
}

export async function uploadShareToAzure(hash: string, data: unknown): Promise<string | null> {
  const cfg = getAzureConfig()
  if (!cfg?.sasUrl || !cfg.containerName) return null
  const f = `d${hash.slice(0, 16)}.json`
  const url = buildBlobUrl(cfg.sasUrl, cfg.containerName, f)
  try {
    const r = await fetch(url, { method: 'PUT', body: JSON.stringify(data), headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': 'application/json' } })
    return r.ok ? url : null
  } catch { return null }
}

export async function downloadShareFromAzure(hash: string): Promise<unknown | null> {
  const cfg = getAzureConfig()
  if (!cfg?.sasUrl || !cfg.containerName) return null
  const url = buildBlobUrl(cfg.sasUrl, cfg.containerName, `d${hash.slice(0, 16)}.json`)
  try { const r = await fetch(url); return r.ok ? r.json() : null }
  catch { return null }
}

export async function downloadUsingManifest(m: string): Promise<unknown | null> {
  try {
    const [v, es, c, f]: Manifest = JSON.parse(m)
    if (v !== 1) return null
    const sasUrl = dec(es)
    console.log('[AzureShare] Decrypted SAS URL starts with:', sasUrl.slice(0, 80))
    console.log('[AzureShare] Container:', c, 'File:', f)
    if (!sasUrl.startsWith('https://')) {
      console.error('[AzureShare] Invalid SAS URL (no https://)')
      return null
    }
    const blobUrl = buildBlobUrl(sasUrl, c, f)
    const resp = await fetch(blobUrl)
    if (resp.ok) return resp.json()
    console.warn(`[AzureShare] Fetch failed: ${resp.status} ${resp.statusText}`)
    return null
  } catch (err) {
    console.error('[AzureShare] downloadUsingManifest error:', err)
    return null
  }
}

export function buildManifestString(hash: string): string | null {
  const cfg = getAzureConfig()
  if (!cfg?.sasUrl || !cfg.containerName) return null
  return JSON.stringify([1, enc(cfg.sasUrl), cfg.containerName, `d${hash.slice(0, 16)}.json`])
}
