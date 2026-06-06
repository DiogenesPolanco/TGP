const PBKDF2_ITERATIONS = 600000

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export interface EncryptedPayload {
  e: true        // encrypted flag
  s: string      // salt (base64)
  i: string      // iv (base64)
  d: string      // data (base64)
}

export async function encryptData(data: unknown, passphrase: string): Promise<EncryptedPayload> {
  const salt = crypto.getRandomValues(new Uint8Array(32))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(passphrase, salt)
  const encoded = new TextEncoder().encode(JSON.stringify(data))
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, encoded)
  return {
    e: true,
    s: btoa(String.fromCharCode(...salt)),
    i: btoa(String.fromCharCode(...iv)),
    d: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
  }
}

export async function decryptData(payload: EncryptedPayload, passphrase: string): Promise<unknown | null> {
  try {
    const salt = new Uint8Array(atob(payload.s).split('').map(c => c.charCodeAt(0)))
    const iv = new Uint8Array(atob(payload.i).split('').map(c => c.charCodeAt(0)))
    const data = new Uint8Array(atob(payload.d).split('').map(c => c.charCodeAt(0)))
    const key = await deriveKey(passphrase, salt)
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, data as BufferSource)
    return JSON.parse(new TextDecoder().decode(decrypted))
  } catch {
    return null
  }
}
