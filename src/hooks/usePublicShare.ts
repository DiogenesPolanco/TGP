import { useState, useEffect } from 'react'
import { isValidShareHash, getShareType, logShareAccess } from '@/services/share/publicShareService'
import { decryptData, isEncryptedPayload, type EncryptedPayload } from '@/services/share/encryptionService'

interface UsePublicShareResult<T> {
  loading: boolean
  valid: boolean
  data: T | null
  pendingEncrypted: EncryptedPayload | null
  handleDecrypt: (pass: string) => Promise<boolean>
}

export function usePublicShare<T>(
  hash: string | undefined,
  localDataLoader: () => Promise<T>,
): UsePublicShareResult<T> {
  const [loading, setLoading] = useState(true)
  const [valid, setValid] = useState(false)
  const [data, setData] = useState<T | null>(null)
  const [pendingEncrypted, setPendingEncrypted] = useState<EncryptedPayload | null>(null)

  useEffect(() => {
    if (!hash) { setValid(false); setLoading(false); return }

    ;(async () => {
      const tryLoad = (raw: unknown) => {
        if (isEncryptedPayload(raw)) {
          setPendingEncrypted(raw)
          setValid(true)
        } else {
          setData(raw as T)
          setValid(true)
        }
        setLoading(false)
      }

      // 1. Try manifest (Azure fragment with SAS + auto-decrypt)
      const rawHash = window.location.hash.replace(/^#/, '')
      if (rawHash) {
        try {
          const fragment = decodeURIComponent(rawHash)
          const { downloadUsingManifest } = await import('@/services/share/azureShareService')
          const azureData = await downloadUsingManifest(fragment)
          if (azureData) {
            logShareAccess(hash, 'azure')
            tryLoad(azureData)
            return
          }
        } catch { /* continue to next source */ }
      }

      // 2. Try Azure direct download (viewer's own config)
      try {
        const { downloadShareFromAzure } = await import('@/services/share/azureShareService')
        const viewerData = await downloadShareFromAzure(hash)
        if (viewerData) {
          logShareAccess(hash, 'azure')
          tryLoad(viewerData)
          return
        }
      } catch { /* continue to next source */ }

      // 3. Try local IndexedDB (same browser that created the link)
      if (isValidShareHash(hash)) {
        const shareType = getShareType(hash)
        const d = await localDataLoader()
        logShareAccess(hash, shareType ?? 'unknown')
        setData(d)
        setValid(true)
      } else {
        setValid(false)
      }

      setLoading(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash])

  const handleDecrypt = async (pass: string): Promise<boolean> => {
    if (!pendingEncrypted) return false
    const decrypted = await decryptData(pendingEncrypted, pass)
    if (decrypted) {
      setData(decrypted as T)
      setPendingEncrypted(null)
      return true
    }
    return false
  }

  return { loading, valid, data, pendingEncrypted, handleDecrypt }
}
