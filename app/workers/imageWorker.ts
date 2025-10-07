interface ImageWorkerRequest {
  id: string
  name?: string
  type?: string
  buffer: ArrayBuffer
  options?: Record<string, unknown>
}

interface ImageWorkerOptions {
  removeExif: boolean
  removeXmp: boolean
  keepIcc: boolean
  resetOrientation: boolean
}

const textDecoder = new TextDecoder()
const textEncoder = new TextEncoder()

self.onmessage = async (event: MessageEvent<ImageWorkerRequest>) => {
  const { id, name, type, buffer } = event.data
  const options = normalizeOptions(event.data.options)

  try {
    const mimeType = detectImageMime(type, name)
    let outputBuffer = buffer

    if (mimeType === 'image/jpeg') {
      const result = stripJpegMetadata(new Uint8Array(buffer), options)
      outputBuffer = result.buffer
      if (result.orientation && result.orientation !== 1 && options.resetOrientation) {
        outputBuffer = await normalizeOrientation(outputBuffer, mimeType, result.orientation)
      }
    } else if (mimeType === 'image/png') {
      outputBuffer = stripPngMetadata(new Uint8Array(buffer), options)
    } else if (mimeType === 'image/webp') {
      outputBuffer = stripWebpMetadata(new Uint8Array(buffer), options)
    }

    postMessage({ id, type: 'result', buffer: outputBuffer, mimeType }, [outputBuffer])
  } catch (error) {
    postMessage({
      id,
      type: 'error',
      message: error instanceof Error ? error.message : String(error)
    })
  }
}

function normalizeOptions(raw?: Record<string, unknown>): ImageWorkerOptions {
  return {
    removeExif: Boolean(raw?.removeExif ?? true),
    removeXmp: Boolean(raw?.removeXmp ?? true),
    keepIcc: raw?.keepIcc === undefined ? true : Boolean(raw.keepIcc),
    resetOrientation: Boolean(raw?.resetOrientation)
  }
}

function detectImageMime(type?: string, name?: string): string {
  if (type) return type
  const ext = name?.split('.').pop()?.toLowerCase()
  if (!ext) return 'application/octet-stream'
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  return 'application/octet-stream'
}

function stripJpegMetadata(input: Uint8Array, options: ImageWorkerOptions): {
  buffer: ArrayBuffer
  orientation: number | null
} {
  if (input.byteLength < 4 || input[0] !== 0xff || input[1] !== 0xd8) {
    return { buffer: input.slice().buffer, orientation: null }
  }

  const segments: Uint8Array[] = []
  segments.push(input.slice(0, 2))

  let offset = 2
  let orientation: number | null = null

  while (offset + 4 <= input.byteLength) {
    if (input[offset] !== 0xff) break
    const marker = (input[offset] << 8) | input[offset + 1]

    if (marker === 0xffda) {
      segments.push(input.slice(offset))
      offset = input.byteLength
      break
    }

    const size = (input[offset + 2] << 8) | input[offset + 3]
    const segmentStart = offset
    const segmentEnd = offset + 2 + size
    if (segmentEnd > input.byteLength) break

    const segment = input.slice(segmentStart, segmentEnd)
    let keep = true

    if (marker === 0xffe1) {
      if (options.removeExif && isExifSegment(segment)) {
        if (orientation === null) orientation = readExifOrientation(segment)
        keep = false
      } else if (options.removeXmp && isXmpSegment(segment)) {
        keep = false
      }
    } else if (marker === 0xffe2 && !options.keepIcc && isIccSegment(segment)) {
      keep = false
    }

    if (keep) {
      segments.push(segment)
    }

    offset = segmentEnd
  }

  if (offset < input.byteLength) {
    segments.push(input.slice(offset))
  }

  const combined = concatUint8Arrays(segments)
  return { buffer: combined.buffer, orientation }
}

function isExifSegment(segment: Uint8Array): boolean {
  if (segment.byteLength <= 10) return false
  const label = textDecoder.decode(segment.slice(4, 10))
  return label.startsWith('Exif\u0000\u0000')
}

function isXmpSegment(segment: Uint8Array): boolean {
  if (segment.byteLength <= 32) return false
  const label = textDecoder.decode(segment.slice(4, 36))
  return label.startsWith('http://ns.adobe.com/xap/1.0/')
}

function isIccSegment(segment: Uint8Array): boolean {
  if (segment.byteLength <= 16) return false
  const label = textDecoder.decode(segment.slice(4, 15))
  return label.startsWith('ICC_PROFILE')
}

function readExifOrientation(segment: Uint8Array): number | null {
  const data = segment.slice(4)
  if (data.byteLength <= 8) return null
  const header = textDecoder.decode(data.slice(0, 6))
  if (!header.startsWith('Exif')) return null

  const view = new DataView(data.buffer, data.byteOffset + 6, data.byteLength - 6)
  const littleEndian = view.getUint16(0, false) === 0x4949
  const ifdOffset = view.getUint32(4, littleEndian)
  if (ifdOffset + 2 > view.byteLength) return null
  const entries = view.getUint16(ifdOffset, littleEndian)
  let entryOffset = ifdOffset + 2
  for (let i = 0; i < entries; i += 1) {
    if (entryOffset + 12 > view.byteLength) break
    const tag = view.getUint16(entryOffset, littleEndian)
    if (tag === 0x0112) {
      const type = view.getUint16(entryOffset + 2, littleEndian)
      const count = view.getUint32(entryOffset + 4, littleEndian)
      if (type === 3 && count >= 1) {
        const valueOffset = entryOffset + 8
        return view.getUint16(valueOffset, littleEndian)
      }
    }
    entryOffset += 12
  }
  return null
}

function stripPngMetadata(input: Uint8Array, options: ImageWorkerOptions): ArrayBuffer {
  if (input.byteLength < 8) return input.slice().buffer
  const signature = input.slice(0, 8)
  const pngSignature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
  if (!signature.every((value, index) => value === pngSignature[index])) {
    return input.slice().buffer
  }

  const chunks: Uint8Array[] = [signature]
  const view = new DataView(input.buffer, input.byteOffset, input.byteLength)
  let offset = 8

  while (offset + 8 <= input.byteLength) {
    const length = view.getUint32(offset)
    const typeBytes = input.slice(offset + 4, offset + 8)
    const type = textDecoder.decode(typeBytes)
    const chunkEnd = offset + 12 + length
    if (chunkEnd > input.byteLength) break
    const chunk = input.slice(offset, chunkEnd)

    let keep = true
    if (type === 'eXIf' && options.removeExif) {
      keep = false
    } else if (['tEXt', 'iTXt', 'zTXt'].includes(type) && options.removeXmp) {
      keep = false
    } else if (type === 'iCCP' && !options.keepIcc) {
      keep = false
    }

    if (keep) {
      chunks.push(chunk)
    }

    offset = chunkEnd
  }

  return concatUint8Arrays(chunks).buffer
}

function stripWebpMetadata(input: Uint8Array, options: ImageWorkerOptions): ArrayBuffer {
  if (input.byteLength < 12) return input.slice().buffer
  const riffHeader = textDecoder.decode(input.slice(0, 4))
  const webpHeader = textDecoder.decode(input.slice(8, 12))
  if (riffHeader !== 'RIFF' || webpHeader !== 'WEBP') {
    return input.slice().buffer
  }

  const chunks: Uint8Array[] = []
  let offset = 12
  const view = new DataView(input.buffer, input.byteOffset, input.byteLength)

  while (offset + 8 <= input.byteLength) {
    const type = textDecoder.decode(input.slice(offset, offset + 4))
    const size = view.getUint32(offset + 4, true)
    let chunkSize = 8 + size
    if (size % 2 === 1) chunkSize += 1
    if (offset + chunkSize > input.byteLength) break
    const chunk = input.slice(offset, offset + chunkSize)

    let keep = true
    if (type === 'EXIF' && options.removeExif) keep = false
    if (type === 'XMP ' && options.removeXmp) keep = false
    if (type === 'ICCP' && !options.keepIcc) keep = false

    if (keep) {
      chunks.push(chunk)
    }

    offset += chunkSize
  }

  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 4)
  const result = new Uint8Array(8 + totalSize)
  result.set(textEncoder.encode('RIFF'), 0)
  new DataView(result.buffer).setUint32(4, totalSize, true)
  result.set(textEncoder.encode('WEBP'), 8)
  let writeOffset = 12
  for (const chunk of chunks) {
    result.set(chunk, writeOffset)
    writeOffset += chunk.byteLength
  }

  return result.buffer
}

function concatUint8Arrays(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0)
  const result = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.byteLength
  }
  return result
}

async function normalizeOrientation(
  buffer: ArrayBuffer,
  mimeType: string,
  orientation: number
): Promise<ArrayBuffer> {
  if (orientation <= 1 || orientation > 8) return buffer
  const blob = new Blob([buffer], { type: mimeType || 'image/jpeg' })
  const bitmap = await createImageBitmap(blob)
  const swap = orientation >= 5 && orientation <= 8
  const canvas = new OffscreenCanvas(swap ? bitmap.height : bitmap.width, swap ? bitmap.width : bitmap.height)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('OffscreenCanvas не поддерживается браузером')

  applyOrientationTransform(context, bitmap.width, bitmap.height, orientation)
  context.drawImage(bitmap, 0, 0)

  const resultBlob = await canvas.convertToBlob({ type: mimeType || 'image/jpeg' })
  return resultBlob.arrayBuffer()
}

function applyOrientationTransform(
  context: OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  orientation: number
) {
  switch (orientation) {
    case 2:
      context.transform(-1, 0, 0, 1, width, 0)
      break
    case 3:
      context.transform(-1, 0, 0, -1, width, height)
      break
    case 4:
      context.transform(1, 0, 0, -1, 0, height)
      break
    case 5:
      context.transform(0, 1, 1, 0, 0, 0)
      break
    case 6:
      context.transform(0, 1, -1, 0, height, 0)
      break
    case 7:
      context.transform(0, -1, -1, 0, height, width)
      break
    case 8:
      context.transform(0, -1, 1, 0, 0, width)
      break
    default:
      break
  }
}

export {}
