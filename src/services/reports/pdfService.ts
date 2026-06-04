import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const PRIMARY = '#2563eb'
const PRIMARY_LIGHT = '#eff6ff'
const TEXT_DARK = '#1e293b'
const TEXT_MUTED = '#64748b'
const BORDER = '#e2e8f0'
const BG_ALT = '#f8fafc'

export interface ReportColumn {
  header: string
  dataKey: string
  width?: number
  align?: 'left' | 'center' | 'right'
}

export interface ReportSection {
  title: string
  columns: ReportColumn[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows: any[]
}

export function generateReport(
  filename: string,
  title: string,
  sections: ReportSection[],
  summaryItems?: { label: string; value: string; color?: string }[],
) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageW = 210
  const margin = 20
  const contentW = pageW - margin * 2
  let y = margin

  const addHeader = () => {
    y = margin
    doc.setFillColor(PRIMARY)
    doc.rect(0, 0, pageW, 28, 'F')

    doc.setTextColor('#ffffff')
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(title, margin, 18)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(
      new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
      pageW - margin,
      18,
      { align: 'right' },
    )

    y = 38
  }

  const addFooter = () => {
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setDrawColor(BORDER)
      doc.line(margin, 285, pageW - margin, 285)
      doc.setTextColor(TEXT_MUTED)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(`TGP — ${title}`, margin, 291)
      doc.text(`Página ${i} de ${totalPages}`, pageW - margin, 291, { align: 'right' })
    }
  }

  const addSummary = (
    items: { label: string; value: string; color?: string }[],
    startY: number,
  ) => {
    let cy = startY
    const cardW = (contentW - 12) / Math.min(items.length, 4)
    const cardH = 22

    for (let i = 0; i < items.length; i++) {
      if (i > 0 && i % 4 === 0) cy += cardH + 6
      const col = i % 4
      const cx = margin + col * (cardW + 4)

      doc.setFillColor('#ffffff')
      doc.setDrawColor(BORDER)
      doc.roundedRect(cx, cy, cardW, cardH, 2, 2, 'FD')

      doc.setFillColor(items[i].color || PRIMARY_LIGHT)
      doc.rect(cx, cy, 3, cardH, 'F')

      doc.setTextColor(TEXT_MUTED)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.text(items[i].label, cx + 8, cy + 8)

      doc.setTextColor(TEXT_DARK)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(items[i].value, cx + 8, cy + 18)
    }

    return cy + cardH + 8
  }

  addHeader()

  if (summaryItems && summaryItems.length > 0) {
    y = addSummary(summaryItems, y)
  }

  for (const section of sections) {
    if (y > 250) {
      doc.addPage()
      y = margin
    }

    doc.setTextColor(TEXT_DARK)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(section.title, margin, y)
    y += 6

    if (section.rows.length === 0) {
      doc.setTextColor(TEXT_MUTED)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text('No hay datos disponibles.', margin, y + 4)
      y += 10
    } else {
      const headers = section.columns.map((c) => c.header)
      const body = section.rows.map((row) =>
        section.columns.map((c) => {
          const val = row[c.dataKey]
          return val != null ? String(val) : '-'
        }),
      )

      autoTable(doc, {
        head: [headers],
        body,
        startY: y,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 8,
          textColor: TEXT_DARK,
          font: 'helvetica',
          lineColor: BORDER,
          lineWidth: 0.5,
        },
        headStyles: {
          fillColor: PRIMARY,
          textColor: '#ffffff',
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'center',
        },
        alternateRowStyles: {
          fillColor: BG_ALT,
        },
        columnStyles: section.columns.reduce(
          (acc, col, idx) => {
            if (col.width) acc[idx] = { cellWidth: col.width }
            if (col.align) acc[idx] = { ...acc[idx], halign: col.align }
            return acc
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {} as any,
        ),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        didParseCell: (data: any) => {
          if (data.section === 'body') {
            const severityColors: Record<string, string> = {
              critical: '#dc2626',
              high: '#ea580c',
              medium: '#ca8a04',
              low: '#16a34a',
              info: '#6366f1',
              eol: '#dc2626',
              extended: '#ca8a04',
              active: '#16a34a',
              unknown: '#94a3b8',
            }
            const cellText = String(data.cell.raw || '')
            const lower = cellText.toLowerCase()
            for (const [key, color] of Object.entries(severityColors)) {
              if (lower === key || lower.startsWith(key)) {
                data.cell.styles.textColor = color
                data.cell.styles.fontStyle = 'bold'
                break
              }
            }
          }
        },
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      y = (doc as any).lastAutoTable.finalY + 8
    }
  }

  addFooter()

  return {
    save: () => doc.save(filename),
    outputBlob: () => doc.output('blob'),
    output: () => doc.output('datauristring'),
  }
}
