import { useState } from 'react'
import { Printer, Image, Loader2 } from 'lucide-react'

export function PrintButton() {
  const [capturing, setCapturing] = useState(false)

  const captureImage = async () => {
    setCapturing(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const el = document.getElementById('printable-content')
      if (!el) return
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        onclone: (doc) => {
          doc.querySelectorAll('.no-print').forEach((el) => el.remove())
        },
      })
      const link = document.createElement('a')
      link.download = `tgp-reporte-${new Date().toISOString().split('T')[0]}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch {
      console.warn('[PrintButton] Error al capturar imagen')
    } finally {
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
