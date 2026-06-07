import { useState } from 'react'
import { Printer, Image, Loader2 } from 'lucide-react'

function inlineComputedStyles(source: HTMLElement, target: HTMLElement) {
  const queue: [HTMLElement, HTMLElement][] = [[source, target]]
  while (queue.length > 0) {
    const [src, tgt] = queue.shift()!
    const cs = getComputedStyle(src)
    for (let i = 0; i < cs.length; i++) {
      const prop = cs[i]
      const val = cs.getPropertyValue(prop)
      if (val && val !== 'none' && !prop.startsWith('--')) {
        tgt.style.setProperty(prop, val)
      }
    }
    for (let i = 0; i < src.children.length; i++) {
      queue.push([src.children[i] as HTMLElement, tgt.children[i] as HTMLElement])
    }
  }
}

export function PrintButton() {
  const [capturing, setCapturing] = useState(false)

  const captureImage = async () => {
    const el = document.getElementById('printable-content')
    if (!el) { console.warn('[PrintButton] #printable-content no encontrado'); return }

    setCapturing(true)
    const noPrint = el.querySelectorAll<HTMLElement>('.no-print')
    try {
      noPrint.forEach((n) => n.style.display = 'none')

      const clone = el.cloneNode(true) as HTMLElement
      clone.querySelectorAll<HTMLElement>('.no-print').forEach((n) => n.remove())
      inlineComputedStyles(el, clone)

      clone.style.position = 'fixed'
      clone.style.left = '0'
      clone.style.top = '0'
      clone.style.zIndex = '-9999'
      clone.style.pointerEvents = 'none'
      document.body.appendChild(clone)

      const rect = clone.getBoundingClientRect()
      const scale = 2
      const canvas = document.createElement('canvas')
      canvas.width = rect.width * scale
      canvas.height = rect.height * scale

      const serializer = new XMLSerializer()
      const html = serializer.serializeToString(clone)
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml">${html}</div>
          </foreignObject>
        </svg>
      `

      document.body.removeChild(clone)

      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const img = new Image()

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          const ctx = canvas.getContext('2d')!
          ctx.scale(scale, scale)
          ctx.drawImage(img, 0, 0)
          URL.revokeObjectURL(url)
          resolve()
        }
        img.onerror = () => {
          URL.revokeObjectURL(url)
          reject(new Error('SVG render failed'))
        }
        img.src = url
      })

      const link = document.createElement('a')
      link.download = `tgp-reporte-${new Date().toISOString().split('T')[0]}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.warn('[PrintButton] Error al capturar imagen:', err)
    } finally {
      noPrint.forEach((n) => n.style.display = '')
      setCapturing(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 no-print">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-neutral-80 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-60 dark:text-neutral-40 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors shadow-sm"
          title="Descargar PDF"
        >
          <Printer size={16} />
          PDF
        </button>
        <button
          onClick={captureImage}
          disabled={capturing}
          className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-neutral-80 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-60 dark:text-neutral-40 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors shadow-sm disabled:opacity-50"
          title="Descargar Imagen"
        >
          {capturing ? <Loader2 size={16} className="animate-spin" /> : <Image size={16} />}
          Imagen
        </button>
      </div>

      <div
        className="print-watermark"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-35deg)',
          fontSize: '28px',
          fontWeight: 'bold',
          color: 'rgba(0, 82, 204, 0.08)',
          zIndex: 9999,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          fontFamily: 'Arial, sans-serif',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          display: 'none',
        }}
      >
        Generado por TGP — Diógenes Polanco
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-watermark { display: block !important; }
          @page { margin: 15mm; }
        }
      `}</style>
    </>
  )
}
