import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { mockEncrypt, mockDecrypt, mockIsEncryptedPayload } = vi.hoisted(() => ({
  mockEncrypt: vi.fn(),
  mockDecrypt: vi.fn(),
  mockIsEncryptedPayload: vi.fn(),
}))

vi.mock('@/services/share/encryptionService', () => ({
  encryptData: mockEncrypt,
  decryptData: mockDecrypt,
  isEncryptedPayload: mockIsEncryptedPayload,
}))

vi.mock('@/services/backup/azureBackupService', () => ({
  getAzureConfig: vi.fn(() => null),
  saveAzureConfig: vi.fn(),
  clearAzureConfig: vi.fn(),
}))

const localStorageStore = new Map<string, string>()
const mockFetch = vi.fn()

beforeEach(() => {
  localStorageStore.clear()
  mockFetch.mockReset()
  mockEncrypt.mockReset()
  mockDecrypt.mockReset()
  mockIsEncryptedPayload.mockReset()
  vi.stubGlobal('fetch', mockFetch)
  vi.stubGlobal('crypto', {
    getRandomValues: vi.fn((buf: Uint8Array) => {
      buf.fill(0x42)
      return buf
    }),
  })

  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: vi.fn((key: string) => localStorageStore.get(key) ?? null),
      setItem: vi.fn((key: string, val: string) => localStorageStore.set(key, val)),
      removeItem: vi.fn((key: string) => localStorageStore.delete(key)),
      clear: vi.fn(() => localStorageStore.clear()),
      get length() {
        return localStorageStore.size
      },
      key: vi.fn((i: number) => [...localStorageStore.keys()][i] ?? null),
    },
    writable: true,
    configurable: true,
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

import {
  getShareAzureConfig,
  saveShareAzureConfig,
  clearShareAzureConfig,
  getShareAzureInfo,
  uploadShareToAzure,
  downloadShareFromAzure,
  downloadUsingManifest,
  buildManifestString,
  listShareContainerBlobs,
  deleteShareBlob,
} from '../azureShareService'

describe('azureShareService', () => {
  describe('config', () => {
    it('getShareAzureConfig returns null when no config stored', () => {
      expect(getShareAzureConfig()).toBeNull()
    })

    it('getShareAzureConfig parses stored config', () => {
      saveShareAzureConfig({ sasUrl: 'https://test', containerName: 'test-container' })
      const config = getShareAzureConfig()
      expect(config).toEqual({ sasUrl: 'https://test', containerName: 'test-container' })
    })

    it('getShareAzureConfig returns null on corrupt data', () => {
      localStorageStore.set('tgp-azure-share-config', 'not-json')
      expect(getShareAzureConfig()).toBeNull()
    })

    it('saveShareAzureConfig stores to localStorage', () => {
      saveShareAzureConfig({ sasUrl: 'https://save', containerName: 'save-container' })
      const raw = localStorageStore.get('tgp-azure-share-config')
      expect(raw).toBe(JSON.stringify({ sasUrl: 'https://save', containerName: 'save-container' }))
    })

    it('clearShareAzureConfig removes config', () => {
      saveShareAzureConfig({ sasUrl: 'https://test', containerName: 'test' })
      clearShareAzureConfig()
      expect(localStorageStore.has('tgp-azure-share-config')).toBe(false)
    })

    it('getShareAzureInfo returns configured=false when no config', () => {
      expect(getShareAzureInfo()).toEqual({ configured: false, containerName: '' })
    })

    it('getShareAzureInfo returns configured=true when config is valid', () => {
      saveShareAzureConfig({ sasUrl: 'https://test', containerName: 'my-container' })
      expect(getShareAzureInfo()).toEqual({ configured: true, containerName: 'my-container' })
    })

    it('getShareAzureInfo returns configured=false when config has empty fields', () => {
      saveShareAzureConfig({ sasUrl: '', containerName: '' })
      expect(getShareAzureInfo()).toEqual({ configured: false, containerName: '' })
    })
  })

  describe('uploadShareToAzure', () => {
    it('returns url:null when no config', async () => {
      const result = await uploadShareToAzure('abc123', { test: true })
      expect(result).toEqual({ url: null })
    })

    it('uploads encrypted data and returns url', async () => {
      mockEncrypt.mockResolvedValue({ iv: 'iv', data: 'encrypted' })
      mockIsEncryptedPayload.mockReturnValue(false)
      saveShareAzureConfig({
        sasUrl: 'https://test.blob.core.windows.net?sv=2020',
        containerName: 'share',
      })
      mockFetch.mockResolvedValue({ ok: true })

      const result = await uploadShareToAzure('abc123def4567890', { test: true })
      expect(result.url).toContain('share/dabc123def4567890.json')
      expect(mockEncrypt).toHaveBeenCalledTimes(1)
    })

    it('double-encrypts when data is already encrypted', async () => {
      mockEncrypt.mockResolvedValue({ iv: 'iv', data: 'encrypted' })
      mockIsEncryptedPayload.mockReturnValue(true)
      saveShareAzureConfig({
        sasUrl: 'https://test.blob.core.windows.net?sv=2020',
        containerName: 'share',
      })
      mockFetch.mockResolvedValue({ ok: true })

      const result = await uploadShareToAzure('abc123', { iv: 'iv', data: 'already-encrypted' })
      expect(result.url).toBeTruthy()
      expect(mockEncrypt).toHaveBeenCalledTimes(2)
    })

    it('returns url:null on fetch failure', async () => {
      mockEncrypt.mockResolvedValue({ iv: 'iv', data: 'encrypted' })
      mockIsEncryptedPayload.mockReturnValue(false)
      saveShareAzureConfig({
        sasUrl: 'https://test.blob.core.windows.net?sv=2020',
        containerName: 'share',
      })
      mockFetch.mockRejectedValue(new Error('network error'))

      const result = await uploadShareToAzure('abc123', { test: true })
      expect(result.url).toBeNull()
    })

    it('returns url:null on non-ok response', async () => {
      mockEncrypt.mockResolvedValue({ iv: 'iv', data: 'encrypted' })
      mockIsEncryptedPayload.mockReturnValue(false)
      saveShareAzureConfig({
        sasUrl: 'https://test.blob.core.windows.net?sv=2020',
        containerName: 'share',
      })
      mockFetch.mockResolvedValue({ ok: false })

      const result = await uploadShareToAzure('abc123', { test: true })
      expect(result.url).toBeNull()
    })
  })

  describe('downloadShareFromAzure', () => {
    it('returns null when no config', async () => {
      const result = await downloadShareFromAzure('abc')
      expect(result).toBeNull()
    })

    it('downloads and parses JSON from Azure', async () => {
      saveShareAzureConfig({
        sasUrl: 'https://test.blob.core.windows.net?sv=2020',
        containerName: 'share',
      })
      mockFetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ data: 'test' }) })

      const result = await downloadShareFromAzure('abc123')
      expect(result).toEqual({ data: 'test' })
    })

    it('returns null on fetch failure', async () => {
      saveShareAzureConfig({
        sasUrl: 'https://test.blob.core.windows.net?sv=2020',
        containerName: 'share',
      })
      mockFetch.mockRejectedValue(new Error('fail'))

      const result = await downloadShareFromAzure('abc123')
      expect(result).toBeNull()
    })

    it('returns null on non-ok response', async () => {
      saveShareAzureConfig({
        sasUrl: 'https://test.blob.core.windows.net?sv=2020',
        containerName: 'share',
      })
      mockFetch.mockResolvedValue({ ok: false })

      const result = await downloadShareFromAzure('abc123')
      expect(result).toBeNull()
    })
  })

  describe('buildManifestString', () => {
    it('returns null when no config', () => {
      expect(buildManifestString('abc123')).toBeNull()
    })

    it('builds v2 manifest with autoKey', () => {
      saveShareAzureConfig({
        sasUrl: 'https://test.blob.core.windows.net?sv=2020',
        containerName: 'share',
      })
      const manifest = buildManifestString('abc123', 'my-auto-key')
      expect(manifest).toBeTruthy()
      if (manifest) {
        const parsed = JSON.parse(manifest)
        expect(parsed[0]).toBe(2)
        expect(parsed[4]).toBe('my-auto-key')
      }
    })

    it('builds v1 manifest without autoKey', () => {
      saveShareAzureConfig({
        sasUrl: 'https://test.blob.core.windows.net?sv=2020',
        containerName: 'share',
      })
      const manifest = buildManifestString('abc123')
      expect(manifest).toBeTruthy()
      if (manifest) {
        const parsed = JSON.parse(manifest)
        expect(parsed[0]).toBe(1)
        expect(parsed.length).toBe(4)
      }
    })
  })

  describe('downloadUsingManifest', () => {
    it('returns null on invalid JSON', async () => {
      const result = await downloadUsingManifest('not-json')
      expect(result).toBeNull()
    })

    it('returns null on unknown version', async () => {
      const result = await downloadUsingManifest(JSON.stringify([3, '', '', '']))
      expect(result).toBeNull()
    })

    it('returns null when decoded sasUrl is not https', async () => {
      const sasUrl = 'http://test'
      const enc = btoa(sasUrl).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      const manifest = JSON.stringify([1, enc, 'container', 'file.json'])
      const result = await downloadUsingManifest(manifest)
      expect(result).toBeNull()
    })

    it('downloads and returns raw data for v1', async () => {
      const sasUrl = 'https://test.blob.core.windows.net?sv=2020'
      const enc = btoa(sasUrl).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      const manifest = JSON.stringify([1, enc, 'container', 'file.json'])
      mockFetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ raw: 'data' }) })

      const result = await downloadUsingManifest(manifest)
      expect(result).toEqual({ raw: 'data' })
    })

    it('auto-decrypts v2 with autoKey', async () => {
      const sasUrl = 'https://test.blob.core.windows.net?sv=2020'
      const enc = btoa(sasUrl).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      const manifest = JSON.stringify([2, enc, 'container', 'file.json', 'mykey'])
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ iv: 'iv', data: 'enc' }),
      })
      mockIsEncryptedPayload.mockReturnValue(true)
      mockDecrypt.mockResolvedValue({ iv: 'iv2', data: 'inner' })

      await downloadUsingManifest(manifest)
      expect(mockDecrypt).toHaveBeenCalledWith({ iv: 'iv', data: 'enc' }, 'mykey')
    })

    it('returns null on fetch failure', async () => {
      const sasUrl = 'https://test.blob.core.windows.net?sv=2020'
      const enc = btoa(sasUrl).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      const manifest = JSON.stringify([1, enc, 'container', 'file.json'])
      mockFetch.mockRejectedValue(new Error('fail'))

      const result = await downloadUsingManifest(manifest)
      expect(result).toBeNull()
    })
  })

  describe('listShareContainerBlobs', () => {
    it('returns empty list when no config', async () => {
      const result = await listShareContainerBlobs()
      expect(result).toEqual([])
    })
  })

  describe('deleteShareBlob', () => {
    it('returns false when no config', async () => {
      const result = await deleteShareBlob('test.json')
      expect(result).toBe(false)
    })

    it('returns true on successful delete', async () => {
      saveShareAzureConfig({
        sasUrl: 'https://test.blob.core.windows.net?sv=2020',
        containerName: 'share',
      })
      mockFetch.mockResolvedValue({ ok: true })
      const result = await deleteShareBlob('test.json')
      expect(result).toBe(true)
    })

    it('returns false on fetch failure', async () => {
      saveShareAzureConfig({
        sasUrl: 'https://test.blob.core.windows.net?sv=2020',
        containerName: 'share',
      })
      mockFetch.mockRejectedValue(new Error('fail'))
      const result = await deleteShareBlob('test.json')
      expect(result).toBe(false)
    })
  })
})
