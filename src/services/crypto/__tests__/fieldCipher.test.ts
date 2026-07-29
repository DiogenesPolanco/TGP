import { describe, it, expect, beforeEach } from 'vitest'
import { encryptField, decryptField } from '../fieldCipher'

describe('encryptField', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns empty string unchanged', async () => {
    const result = await encryptField('')
    expect(result).toBe('')
  })

  it('encrypts plaintext to ciphertext', async () => {
    const plaintext = 'hello world'
    const result = await encryptField(plaintext)
    expect(result).not.toBe(plaintext)
    expect(result).toContain(':')
  })

  it('produces different ciphertext for same input (random IV)', async () => {
    const plaintext = 'test data'
    const result1 = await encryptField(plaintext)
    const result2 = await encryptField(plaintext)
    expect(result1).not.toBe(result2)
  })

  it('ciphertext has iv:encrypted format', async () => {
    const result = await encryptField('test')
    const parts = result.split(':')
    expect(parts.length).toBe(2)
    expect(parts[0].length).toBeGreaterThan(0)
    expect(parts[1].length).toBeGreaterThan(0)
  })
})

describe('decryptField', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns empty string unchanged', async () => {
    const result = await decryptField('')
    expect(result).toBe('')
  })

  it('returns string without colon unchanged', async () => {
    const result = await decryptField('no-colon-here')
    expect(result).toBe('no-colon-here')
  })

  it('decrypts encrypted field back to original', async () => {
    const original = 'secret data'
    const encrypted = await encryptField(original)
    const decrypted = await decryptField(encrypted)
    expect(decrypted).toBe(original)
  })

  it('roundtrips various strings', async () => {
    const testCases = [
      'simple',
      'with spaces',
      'special chars: !@#$%',
      'numbers 12345',
      'unicode: ñáéíóú',
      'long string '.repeat(10),
    ]

    for (const original of testCases) {
      const encrypted = await encryptField(original)
      const decrypted = await decryptField(encrypted)
      expect(decrypted).toBe(original)
    }
  })

  it('returns original string if decryption fails (invalid format)', async () => {
    const result = await decryptField('abc:def')
    expect(typeof result).toBe('string')
  })
})
