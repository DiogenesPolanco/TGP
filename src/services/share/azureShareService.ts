import { getAzureConfig as _getAzureConfig } from '@/services/backup/azureBackupService'
export const getAzureConfig = _getAzureConfig

const CIPHER_KEY = 'TGP_SHARE_2026_XOR'

function toB64u(s: string): string {
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function fromB64u(s: string): string {
  const pad = s.length % 4 === 3 ? '=' : s.length % 4 === 2 ? '==' : ''
  return s.replace(/-/g, '+').replace(/_/g, '/') + pad
}

function encrypt(text: string): string {
  let out = ''
  for (let i = 0; i < text.length; i++)
    out += String.fromCharCode(text.charCodeAt(i) ^ CIPHER_KEY.charCodeAt(i % CIPHER_KEY.length))
  return toB64u(btoa(out))
}
function decrypt(encoded: string): string {
  const text = atob(fromB64u(encoded))
  let out = ''
  for (let i = 0; i < text.length; i++)
    out += String.fromCharCode(text.charCodeAt(i) ^ CIPHER_KEY.charCodeAt(i % CIPHER_KEY.length))
  return out
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
    const r = await fetch(buildBlobUrl(decrypt(es), c, f))
    return r.ok ? r.json() : null
  } catch { return null }
}

export function buildManifestString(hash: string): string | null {
  const cfg = getAzureConfig()
  if (!cfg?.sasUrl || !cfg.containerName) return null
  return JSON.stringify([1, encrypt(cfg.sasUrl), cfg.containerName, `d${hash.slice(0, 16)}.json`])
}
