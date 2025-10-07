interface VideoWorkerRequest {
  id: string
  name?: string
  type?: string
  buffer: ArrayBuffer
}

const textDecoder = new TextDecoder()

self.onmessage = (event: MessageEvent<VideoWorkerRequest>) => {
  const { id, name, type, buffer } = event.data
  try {
    const mime = detectVideoMime(type, name)
    let cleaned = buffer
    if (mime === 'video/mp4' || mime === 'video/quicktime') {
      cleaned = stripMp4Metadata(new Uint8Array(buffer))
    }
    postMessage({ id, type: 'result', buffer: cleaned, mimeType: mime }, [cleaned])
  } catch (error) {
    postMessage({
      id,
      type: 'error',
      message: error instanceof Error ? error.message : String(error)
    })
  }
}

function detectVideoMime(type?: string, name?: string): string {
  if (type) return type
  const ext = name?.split('.').pop()?.toLowerCase()
  if (!ext) return 'application/octet-stream'
  if (ext === 'mp4' || ext === 'm4v') return 'video/mp4'
  if (ext === 'mov') return 'video/quicktime'
  return 'application/octet-stream'
}

function stripMp4Metadata(input: Uint8Array): ArrayBuffer {
  if (input.byteLength < 8) return input.slice().buffer
  const parts: Uint8Array[] = []
  const view = new DataView(input.buffer, input.byteOffset, input.byteLength)
  let offset = 0

  while (offset + 8 <= input.byteLength) {
    let size = view.getUint32(offset)
    if (size === 1) {
      parts.push(input.slice(offset))
      break
    }
    if (size === 0) size = input.byteLength - offset
    if (size < 8 || offset + size > input.byteLength) {
      parts.push(input.slice(offset))
      break
    }

    const type = textDecoder.decode(input.slice(offset + 4, offset + 8))
    const box = input.slice(offset, offset + size)
    if (type === 'moov') {
      parts.push(cleanContainerBox(box, new Set(['udta', 'meta', 'ilst'])))
    } else {
      parts.push(box)
    }
    offset += size
  }

  if (offset < input.byteLength) {
    parts.push(input.slice(offset))
  }

  return concatUint8Arrays(parts).buffer
}

function cleanContainerBox(box: Uint8Array, removeTypes: Set<string>): Uint8Array {
  if (box.byteLength < 8) return box.slice()
  const type = textDecoder.decode(box.slice(4, 8))
  const headerSize = type === 'meta' ? 12 : 8
  if (box.byteLength < headerSize) return box.slice()

  const content = box.slice(headerSize)
  const cleanedChildren = removeChildBoxes(content, removeTypes)
  const newSize = headerSize + cleanedChildren.byteLength
  const result = new Uint8Array(newSize)
  const view = new DataView(result.buffer)
  view.setUint32(0, newSize)
  result.set(box.slice(4, 8), 4)
  if (headerSize > 8) {
    result.set(box.slice(8, headerSize), 8)
  }
  result.set(cleanedChildren, headerSize)
  return result
}

function removeChildBoxes(data: Uint8Array, removeTypes: Set<string>): Uint8Array {
  const parts: Uint8Array[] = []
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  let offset = 0

  while (offset + 8 <= data.byteLength) {
    let size = view.getUint32(offset)
    if (size === 1) {
      parts.push(data.slice(offset))
      break
    }
    if (size === 0) size = data.byteLength - offset
    if (size < 8 || offset + size > data.byteLength) {
      parts.push(data.slice(offset))
      break
    }

    const type = textDecoder.decode(data.slice(offset + 4, offset + 8))
    const box = data.slice(offset, offset + size)

    if (!removeTypes.has(type)) {
      if (isContainerBox(type)) {
        parts.push(cleanContainerBox(box, removeTypes))
      } else {
        parts.push(box)
      }
    }

    offset += size
  }

  if (offset < data.byteLength) {
    parts.push(data.slice(offset))
  }

  return concatUint8Arrays(parts)
}

function isContainerBox(type: string): boolean {
  return ['moov', 'trak', 'mdia', 'minf', 'stbl', 'dinf', 'edts'].includes(type)
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

export {}
