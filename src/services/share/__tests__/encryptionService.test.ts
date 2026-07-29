import { describe, it, expect } from 'vitest'
import { encryptData, decryptData, isEncryptedPayload } from '../encryptionService'

describe('encryptionService', () => {
  it('isEncryptedPayload returns true for valid payload', () => {
    expect(isEncryptedPayload({ e: true, s: 's', i: 'i', d: 'd' })).toBe(true)
  })

  it('isEncryptedPayload returns false for null', () => {
    expect(isEncryptedPayload(null)).toBe(false)
  })

  it('isEncryptedPayload returns false for plain object', () => {
    expect(isEncryptedPayload({ key: 'value' })).toBe(false)
  })

  it('isEncryptedPayload returns false for primitive', () => {
    expect(isEncryptedPayload('string')).toBe(false)
  })

  it('encrypts and decrypts data with same passphrase', async () => {
    const data = { hello: 'world', num: 42 }
    const encrypted = await encryptData(data, 'test-passphrase')
    expect(encrypted.e).toBe(true)
    expect(typeof encrypted.s).toBe('string')
    expect(typeof encrypted.i).toBe('string')
    expect(typeof encrypted.d).toBe('string')
    expect(encrypted.s.length).toBeGreaterThan(0)
    expect(encrypted.i.length).toBeGreaterThan(0)
    expect(encrypted.d.length).toBeGreaterThan(0)

    const decrypted = await decryptData(encrypted, 'test-passphrase')
    expect(decrypted).toEqual(data)
  })

  it('returns null when decrypting with wrong passphrase', async () => {
    const data = { secret: 'value' }
    const encrypted = await encryptData(data, 'correct-pass')
    const result = await decryptData(encrypted, 'wrong-pass')
    expect(result).toBeNull()
  })

  it('returns null when decrypting corrupted payload', async () => {
    const result = await decryptData({ e: true, s: 'AAAA', i: 'AAAA', d: 'AAAA' }, 'any-pass')
    expect(result).toBeNull()
  })

  it('round-trips complex nested objects', async () => {
    const data = {
      array: [1, 2, { nested: true }],
      date: new Date().toISOString(),
      empty: null,
      boolean: false,
    }
    const encrypted = await encryptData(data, 'complex-pass')
    const decrypted = await decryptData(encrypted, 'complex-pass')
    expect(decrypted).toEqual(data)
  })
})
