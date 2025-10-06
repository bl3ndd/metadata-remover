export type MimeKind = 'image' | 'pdf' | 'video' | 'unknown'

const MIME_MAP: Record<string, MimeKind> = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'application/pdf': 'pdf',
  'video/mp4': 'video',
  'video/quicktime': 'video'
}

export function detectMimeKind(type: string | undefined | null): MimeKind {
  if (!type) return 'unknown'
  return MIME_MAP[type] ?? 'unknown'
}
