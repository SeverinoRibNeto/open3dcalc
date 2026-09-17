import { pdf } from '@react-pdf/renderer'
import { ReportDoc } from '@/shared/lib/ReportDoc'
import { ExecutiveReportDoc, type ExecutiveReportData } from '@/shared/lib/ExecutiveReportDoc'
import { downloadPdfBlob } from '@/shared/lib/pdfDownload'
import type { CalculationResult } from '@/shared/types'

export async function exportPdf(result: CalculationResult, locale?: string, currency?: string) {
  try {
    const blob = await pdf(<ReportDoc result={result} locale={locale} currency={currency} />).toBlob()
    const lang = locale?.split('-')[0] || 'pt'
    downloadPdfBlob(blob, `open3dcalc_report_${lang}.pdf`)
    return true
  } catch (error) {
    console.error('Falha ao gerar o relatório PDF.', error)
    return false
  }
}

export async function exportExecutivePdf(data: ExecutiveReportData, locale?: string, currency?: string) {
  try {
    const dateStr = new Date().toISOString().split('T')[0]
    const enrichedData = { ...data, locale, currency }
    const blob = await pdf(<ExecutiveReportDoc {...enrichedData} />).toBlob()
    const lang = locale?.split('-')[0] || 'pt'
    downloadPdfBlob(blob, `open3dcalc_executive_report_${dateStr}_${lang}.pdf`)
    return true
  } catch (error) {
    console.error('Falha ao gerar o relatório executivo em PDF.', error)
    return false
  }
}
