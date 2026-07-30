import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Props {
  url: string
  onCopy: () => void
  copied: boolean
}

export function ShareUrlBanner({ url, onCopy, copied }: Props) {
  const cleanUrl = url.split('#')[0]
  return (
    <div className="bg-card rounded-xl border border-boundary p-4 flex items-center gap-3 max-w-full overflow-hidden">
      <span className="text-sm text-neutral-50 shrink-0">Enlace público:</span>
      <a
        href={cleanUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 text-xs bg-primary/5 dark:bg-primary/10 px-3 py-1.5 rounded-lg text-primary hover:text-primary-dark truncate font-mono min-w-0 hover:underline"
      >
        {cleanUrl}
      </a>
      <Button
        onClick={onCopy}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors bg-primary/10 text-primary hover:bg-primary/20 shrink-0"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? 'Copiado' : 'Copiar'}
      </Button>
    </div>
  )
}
