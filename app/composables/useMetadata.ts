import { ref } from 'vue'
import { detectMimeKind } from '@/utils/mime'

export type MetadataGroup = Record<string, string>
export type NormalizedMetadata = Record<string, MetadataGroup>

export interface MetadataResult {
  kind: SupportedKind
  metadata: NormalizedMetadata
}

export type SupportedKind = 'image' | 'pdf' | 'video' | 'unknown'

export async function detectKind(file: File): Promise<SupportedKind> {
  const detected = detectMimeKind(file.type)
  if (detected !== 'unknown') return detected
  // Fallback by extension
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!ext) return 'unknown'
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return 'image'
  if (ext === 'pdf') return 'pdf'
  if (['mp4', 'mov', 'm4v'].includes(ext)) return 'video'
  return 'unknown'
}

export function useMetadata() {
  const loading = ref(false)

  async function readMeta(file: File): Promise<MetadataResult> {
    loading.value = true
    try {
      const kind = await detectKind(file)
      const metadata: NormalizedMetadata = {
        Общие: {
          'Имя файла': file.name,
          'Тип': file.type || 'Неизвестен',
          'Размер': `${(file.size / 1024).toFixed(1)} KB`
        }
      }
      return { kind, metadata }
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    readMeta
  }
}
