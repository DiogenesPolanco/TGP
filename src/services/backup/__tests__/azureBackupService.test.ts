import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const CONFIG_KEY = 'tgp-azure-backup'
const LAST_BACKUP_KEY = 'tgp-azure-last-backup'

const mockContainerClient = vi.hoisted(() => ({
  listBlobsFlat: vi.fn(),
  getBlockBlobClient: vi.fn(),
}))

const mockBlockBlobClient = vi.hoisted(() => ({
  upload: vi.fn(),
  download: vi.fn(),
}))

vi.mock('@azure/storage-blob', () => ({
  ContainerClient: function () {
    return mockContainerClient
  } as unknown as typeof import('@azure/storage-blob').ContainerClient,
}))

vi.mock('@/services/export/exportService', () => ({
  exportDatabase: vi.fn().mockResolvedValue({
    version: '1.0',
    exportedAt: new Date().toISOString(),
    tables: {},
  }),
  dateReviver: vi.fn((_key, val) => val),
  importBackup: vi.fn().mockResolvedValue({
    success: true,
    tablesRestored: ['tenants (5 registros)'],
    tablesWithErrors: [],
    totalRecords: 5,
    errors: [],
  }),
}))

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  mockBlockBlobClient.upload.mockResolvedValue({})
  mockBlockBlobClient.download.mockResolvedValue({
    blobBody: Promise.resolve(new Blob(['{}'])),
  })
  mockContainerClient.getBlockBlobClient.mockReturnValue(mockBlockBlobClient)
  mockContainerClient.listBlobsFlat.mockReturnValue(
    (async function* () {
      yield {
        name: 'tgp-backup-2026-01-15.json',
        properties: { contentLength: 1024, lastModified: new Date('2026-01-15') },
      }
    })(),
  )
})

afterEach(() => {
  vi.restoreAllMocks()
})

import {
  getAzureConfig,
  saveAzureConfig,
  clearAzureConfig,
  getAzureBackupInfo,
  testAzureConnection,
  uploadBackupToAzure,
  listAzureBackups,
  downloadBackupFromAzure,
  restoreFromAzure,
} from '../azureBackupService'
import type { AzureBackupConfig } from '../azureBackupService'

describe('getAzureConfig', () => {
  it('returns null when no config stored', () => {
    expect(getAzureConfig()).toBeNull()
  })

  it('returns parsed config when stored', () => {
    const config: AzureBackupConfig = {
      sasUrl: 'https://example.com?sv=2020',
      containerName: 'backups',
    }
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
    const result = getAzureConfig()
    expect(result).toEqual(config)
  })

  it('returns null when parsing fails', () => {
    localStorage.setItem(CONFIG_KEY, 'invalid json')
    expect(getAzureConfig()).toBeNull()
  })
})

describe('saveAzureConfig', () => {
  it('stores config and clears last backup', () => {
    const config: AzureBackupConfig = { sasUrl: 'https://test.com', containerName: 'my-container' }
    localStorage.setItem(LAST_BACKUP_KEY, JSON.stringify({ date: '2026-01-01', name: 'old.json' }))
    saveAzureConfig(config)
    expect(localStorage.getItem(CONFIG_KEY)).toBe(JSON.stringify(config))
    expect(localStorage.getItem(LAST_BACKUP_KEY)).toBeNull()
  })
})

describe('clearAzureConfig', () => {
  it('removes both config and last backup', () => {
    localStorage.setItem(CONFIG_KEY, '{"sasUrl":"x"}')
    localStorage.setItem(LAST_BACKUP_KEY, '{"date":"2026-01-01","name":"x"}')
    clearAzureConfig()
    expect(localStorage.getItem(CONFIG_KEY)).toBeNull()
    expect(localStorage.getItem(LAST_BACKUP_KEY)).toBeNull()
  })
})

describe('getAzureBackupInfo', () => {
  it('returns not configured when no config', () => {
    const info = getAzureBackupInfo()
    expect(info.configured).toBe(false)
    expect(info.lastBackup).toBeNull()
  })

  it('returns configured when config has valid values', () => {
    localStorage.setItem(
      CONFIG_KEY,
      JSON.stringify({ sasUrl: 'https://x.com', containerName: 'c' }),
    )
    const info = getAzureBackupInfo()
    expect(info.configured).toBe(true)
    expect(info.containerName).toBe('c')
  })

  it('returns last backup info', () => {
    localStorage.setItem(
      CONFIG_KEY,
      JSON.stringify({ sasUrl: 'https://x.com', containerName: 'c' }),
    )
    localStorage.setItem(
      LAST_BACKUP_KEY,
      JSON.stringify({ date: '2026-06-15T10:00:00.000Z', name: 'backup.json' }),
    )
    const info = getAzureBackupInfo()
    expect(info.lastBackup).toBe('2026-06-15T10:00:00.000Z')
    expect(info.lastBackupName).toBe('backup.json')
  })

  it('handles corrupted last backup gracefully', () => {
    localStorage.setItem(
      CONFIG_KEY,
      JSON.stringify({ sasUrl: 'https://x.com', containerName: 'c' }),
    )
    localStorage.setItem(LAST_BACKUP_KEY, 'not json')
    const info = getAzureBackupInfo()
    expect(info.configured).toBe(true)
    expect(info.lastBackup).toBeNull()
  })

  it('returns not configured when sasUrl is empty', () => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify({ sasUrl: '', containerName: 'c' }))
    expect(getAzureBackupInfo().configured).toBe(false)
  })
})

describe('testAzureConnection', () => {
  it('returns error when not configured', async () => {
    localStorage.removeItem(CONFIG_KEY)
    const result = await testAzureConnection()
    expect(result.success).toBe(false)
    expect(result.message).toContain('no configurado')
  })

  it('returns success when connection works', async () => {
    localStorage.setItem(
      CONFIG_KEY,
      JSON.stringify({ sasUrl: 'https://x.com', containerName: 'c' }),
    )
    const result = await testAzureConnection()
    expect(result.success).toBe(true)
  })
})

describe('uploadBackupToAzure', () => {
  it('uploads backup blob', async () => {
    localStorage.setItem(
      CONFIG_KEY,
      JSON.stringify({ sasUrl: 'https://x.com', containerName: 'c' }),
    )
    const result = await uploadBackupToAzure()
    expect(result.blobName).toContain('tgp-backup-')
    expect(result.sizeBytes).toBeGreaterThan(0)
  })

  it('throws when not configured', async () => {
    await expect(uploadBackupToAzure()).rejects.toThrow('Azure Backup no configurado')
  })

  it('stores last backup info on success', async () => {
    localStorage.setItem(
      CONFIG_KEY,
      JSON.stringify({ sasUrl: 'https://x.com', containerName: 'c' }),
    )
    await uploadBackupToAzure()
    expect(localStorage.getItem(LAST_BACKUP_KEY)).toBeTruthy()
  })
})

describe('listAzureBackups', () => {
  it('returns sorted blob list', async () => {
    localStorage.setItem(
      CONFIG_KEY,
      JSON.stringify({ sasUrl: 'https://x.com', containerName: 'c' }),
    )
    mockContainerClient.listBlobsFlat.mockReturnValue(
      (async function* () {
        yield {
          name: 'tgp-backup-2026-01-16.json',
          properties: { contentLength: 512, lastModified: new Date('2026-01-16') },
        }
        yield {
          name: 'tgp-backup-2026-01-15.json',
          properties: { contentLength: 1024, lastModified: new Date('2026-01-15') },
        }
      })(),
    )
    const blobs = await listAzureBackups()
    expect(blobs).toHaveLength(2)
    expect(blobs[0].name).toContain('2026-01-16')
    expect(blobs[1].name).toContain('2026-01-15')
  })

  it('returns empty array on error', async () => {
    localStorage.setItem(
      CONFIG_KEY,
      JSON.stringify({ sasUrl: 'https://x.com', containerName: 'c' }),
    )
    mockContainerClient.listBlobsFlat.mockImplementation(() => {
      throw new Error('fail')
    })
    const blobs = await listAzureBackups()
    expect(blobs).toEqual([])
  })
})

describe('downloadBackupFromAzure', () => {
  it('downloads and parses backup', async () => {
    localStorage.setItem(
      CONFIG_KEY,
      JSON.stringify({ sasUrl: 'https://x.com', containerName: 'c' }),
    )
    const content = JSON.stringify({
      version: '1.0',
      exportedAt: '2026-01-15T00:00:00.000Z',
      tables: {},
    })
    mockBlockBlobClient.download.mockResolvedValue({
      blobBody: Promise.resolve(new Blob([content])),
    })
    const result = await downloadBackupFromAzure('blob.json')
    expect(result.version).toBe('1.0')
  })

  it('throws when blobBody is null', async () => {
    localStorage.setItem(
      CONFIG_KEY,
      JSON.stringify({ sasUrl: 'https://x.com', containerName: 'c' }),
    )
    mockBlockBlobClient.download.mockResolvedValue({ blobBody: Promise.resolve(null) })
    await expect(downloadBackupFromAzure('blob.json')).rejects.toThrow('No se pudo descargar')
  })
})

describe('restoreFromAzure', () => {
  it('downloads and imports backup', async () => {
    localStorage.setItem(
      CONFIG_KEY,
      JSON.stringify({ sasUrl: 'https://x.com', containerName: 'c' }),
    )
    mockBlockBlobClient.download.mockResolvedValue({
      blobBody: Promise.resolve(new Blob(['{}'])),
    })
    const result = await restoreFromAzure('blob.json')
    expect(result.success).toBe(true)
    expect(result.totalRecords).toBe(5)
  })
})
