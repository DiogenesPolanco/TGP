const STORAGE_SALT = 'tgp-field-cipher-salt'

async function deriveKey(salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const fingerprint = [window.location.origin, navigator.userAgent].join('::')

  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(fingerprint),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

function getOrCreateSalt(): Uint8Array<ArrayBuffer> {
  const raw = localStorage.getItem(STORAGE_SALT)
  if (raw)
    return new Uint8Array(
      atob(raw)
        .split('')
        .map((c) => c.charCodeAt(0)),
    )
  const salt = crypto.getRandomValues(new Uint8Array(16))
  localStorage.setItem(STORAGE_SALT, btoa(String.fromCharCode(...salt)))
  return salt
}

function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  return new Uint8Array(
    atob(b64)
      .split('')
      .map((c) => c.charCodeAt(0)),
  )
}

function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
}

export async function encryptField(plaintext: string): Promise<string> {
  if (!plaintext) return plaintext
  const salt = getOrCreateSalt()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(salt)
  const enc = new TextEncoder()
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext))

  return `${bytesToBase64(iv)}:${bytesToBase64(new Uint8Array(encrypted))}`
}

export async function decryptField(ciphertext: string): Promise<string> {
  if (!ciphertext || !ciphertext.includes(':')) return ciphertext
  const parts = ciphertext.split(':')
  if (parts.length !== 2) return ciphertext

  const salt = getOrCreateSalt()
  const iv = base64ToBytes(parts[0])
  const data = base64ToBytes(parts[1])
  const key = await deriveKey(salt)

  try {
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
    return new TextDecoder().decode(decrypted)
  } catch {
    return ciphertext
  }
}
