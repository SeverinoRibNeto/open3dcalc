import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { pdfMock, toBlobMock } = vi.hoisted(() => ({
  pdfMock: vi.fn(),
  toBlobMock: vi.fn(),
}))

vi.mock('@react-pdf/renderer', () => ({
  pdf: pdfMock,
}))

vi.mock('@/shared/lib/ReportDoc', () => ({
  ReportDoc: () => null,
}))

vi.mock('@/shared/lib/ExecutiveReportDoc', () => ({
  ExecutiveReportDoc: () => null,
}))

import { downloadPdfBlob } from '../pdfDownload'
import { exportPdf } from '../pdfExport'

describe('PDF export', () => {
  const createObjectURL = vi.fn(() => 'blob:pdf-test')
  const revokeObjectURL = vi.fn()
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL,
      revokeObjectURL,
    })
    pdfMock.mockReturnValue({ toBlob: toBlobMock })
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('downloads through a temporary DOM anchor and revokes the URL later', () => {
    const blob = new Blob(['pdf'], { type: 'application/pdf' })

    downloadPdfBlob(blob, 'relatorio.pdf')

    expect(createObjectURL).toHaveBeenCalledWith(blob)
    expect(click).toHaveBeenCalledOnce()
    expect(document.querySelector('a[download="relatorio.pdf"]')).toBeNull()
    expect(revokeObjectURL).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1000)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:pdf-test')
  })

  it('handles renderer failures without leaving an unhandled rejection', async () => {
    const error = new WebAssembly.CompileError('blocked by CSP')
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    toBlobMock.mockRejectedValueOnce(error)

    const succeeded = await exportPdf({} as never, 'pt-BR', 'BRL')

    expect(succeeded).toBe(false)
    expect(consoleError).toHaveBeenCalledWith('Falha ao gerar o relatório PDF.', error)
    expect(createObjectURL).not.toHaveBeenCalled()
  })
})

describe('web Content Security Policy', () => {
  it('allows WebAssembly compilation without allowing general eval', () => {
    const html = readFileSync(resolve(process.cwd(), 'index.web.html'), 'utf8')
    const scriptSrc = html.match(/script-src\s+([^;]+)/)?.[1].trim().split(/\s+/)
    const connectSrc = html.match(/connect-src\s+([^;]+)/)?.[1].trim().split(/\s+/)

    expect(scriptSrc).toContain("'self'")
    expect(scriptSrc).toContain("'wasm-unsafe-eval'")
    expect(scriptSrc).not.toContain("'unsafe-eval'")
    expect(connectSrc).toEqual(["'self'", 'data:'])
  })
})
