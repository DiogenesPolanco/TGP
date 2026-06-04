import * as XLSX from 'xlsx'
import type { ReportSection } from './pdfService'

export function generateExcel(
  filename: string,
  title: string,
  sections: ReportSection[],
  summaryItems?: { label: string; value: string; color?: string }[],
) {
  const wb = XLSX.utils.book_new()

  if (summaryItems && summaryItems.length > 0) {
    const ws = XLSX.utils.aoa_to_sheet([
      [title],
      [],
      ...summaryItems.map((s) => [s.label, s.value]),
    ])
    XLSX.utils.book_append_sheet(wb, ws, 'Resumen')
  }

  for (const section of sections) {
    if (section.rows.length === 0) continue

    const headers = section.columns.map((c) => c.header)
    const data = section.rows.map((row) =>
      section.columns.map((c) => {
        const val = row[c.dataKey]
        return val != null ? String(val) : '-'
      }),
    )

    const wsName = section.title.slice(0, 31)
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data])

    const colWidths = section.columns.map((c) => {
      const maxLen = Math.max(
        c.header.length,
        ...data.map((row) => String(row[section.columns.indexOf(c)] || '').length),
      )
      return { wch: Math.min(Math.max(maxLen + 2, 12), 40) }
    })
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, wsName)
  }

  XLSX.writeFile(wb, filename)
}
