import { useCallback } from 'react'
import { useConfirmStore } from '@/stores/confirmStore'

export function useConfirm() {
  const show = useConfirmStore((s) => s.show)

  const confirm = useCallback(
    async (message: string): Promise<boolean> => {
      return show(message)
    },
    [show],
  )

  return { confirm }
}
