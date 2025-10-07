import { PDFDocument, PDFName } from 'pdf-lib'

interface PdfWorkerRequest {
  id: string
  buffer: ArrayBuffer
  options?: Record<string, unknown>
}

self.onmessage = async (event: MessageEvent<PdfWorkerRequest>) => {
  const { id, buffer, options } = event.data
  try {
    const pdfDoc = await PDFDocument.load(buffer)
    const normalized = normalizeOptions(options)

    pdfDoc.setAuthor(normalized.author)
    pdfDoc.setTitle(normalized.title)
    pdfDoc.setSubject('')
    pdfDoc.setCreator('')
    pdfDoc.setProducer('')
    if (normalized.keywords.length) {
      pdfDoc.setKeywords(normalized.keywords)
    } else {
      pdfDoc.setKeywords('')
    }
    pdfDoc.catalog.delete(PDFName.of('Metadata'))

    const cleaned = await pdfDoc.save()
    const resultBuffer = cleaned.buffer.slice(cleaned.byteOffset, cleaned.byteOffset + cleaned.byteLength)
    postMessage({ id, type: 'result', buffer: resultBuffer, mimeType: 'application/pdf' }, [resultBuffer])
  } catch (error) {
    postMessage({
      id,
      type: 'error',
      message: error instanceof Error ? error.message : String(error)
    })
  }
}

function normalizeOptions(options?: Record<string, unknown>) {
  const author = typeof options?.author === 'string' ? options.author : ''
  const title = typeof options?.title === 'string' ? options.title : ''
  const keywordsValue = typeof options?.keywords === 'string' ? options.keywords : ''
  const keywords = keywordsValue
    .split(',')
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length > 0)

  return { author, title, keywords }
}

export {}
