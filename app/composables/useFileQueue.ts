import { computed, reactive, ref } from 'vue'
import { nanoid } from 'nanoid/non-secure'
import type { NormalizedMetadata, SupportedKind } from './useMetadata'
import { useMetadata } from './useMetadata'
import { downloadBlob } from '@/utils/blob'
import { formatBytes } from '@/utils/sanitize'

export type QueueStatus = 'idle' | 'parsing' | 'parsed' | 'cleaning' | 'cleaned' | 'error'

export interface QueueItem {
  id: string
  file: File
  status: QueueStatus
  kind: SupportedKind
  metadata: NormalizedMetadata | null
  cleanedBlob: Blob | null
  previewUrl: string | null
  error?: string
}

interface ToastItem {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
}

const DEFAULT_OPTIONS = {
  image: {
    removeExif: true,
    removeXmp: true,
    keepIcc: true,
    resetOrientation: false
  },
  pdf: {
    author: '',
    title: '',
    keywords: ''
  },
  video: {},
  unknown: {}
} as const

export function useFileQueue() {
  const items = ref<QueueItem[]>([])
  const activeId = ref<string | null>(null)
  const metadata = ref<NormalizedMetadata | null>(null)
  const cleanerOptions = reactive<Record<string, Record<string, unknown>>>({})
  const toast = reactive<{ list: ToastItem[] }>({ list: [] })
  const { readMeta } = useMetadata()

  function pushToast(message: string, type: ToastItem['type'] = 'info') {
    const id = nanoid()
    toast.list.push({ id, message, type })
    setTimeout(() => {
      const index = toast.list.findIndex((item) => item.id === id)
      if (index >= 0) toast.list.splice(index, 1)
    }, 4000)
  }

  async function processItem(item: QueueItem) {
    item.status = 'parsing'
    try {
      const result = await readMeta(item.file)
      item.metadata = result.metadata
      item.kind = result.kind
      item.status = 'parsed'
      metadata.value = result.metadata
      if (!cleanerOptions[item.id]) {
        const defaults = (DEFAULT_OPTIONS as Record<string, Record<string, unknown>>)[result.kind] ?? {}
        cleanerOptions[item.id] = { ...defaults }
      }
      if (!item.previewUrl && item.kind !== 'unknown') {
        item.previewUrl = URL.createObjectURL(item.file)
      }
    } catch (error) {
      item.status = 'error'
      item.error = error instanceof Error ? error.message : String(error)
      pushToast(`Не удалось прочитать метаданные: ${item.error}`, 'error')
    }
  }

  function createItem(file: File): QueueItem {
    const item: QueueItem = {
      id: nanoid(),
      file,
      status: 'idle',
      kind: 'unknown',
      metadata: null,
      cleanedBlob: null,
      previewUrl: null
    }
    cleanerOptions[item.id] = {}
    return item
  }

  async function enqueue(files: File[]) {
    for (const file of files) {
      const item = createItem(file)
      items.value.push(item)
      activeId.value = item.id
      await processItem(item)
    }
  }

  const activeItem = computed(() => items.value.find((item) => item.id === activeId.value) ?? null)

  function inspect(item: QueueItem) {
    activeId.value = item.id
    metadata.value = item.metadata
  }

  async function clean(item: QueueItem) {
    if (item.status === 'cleaning') return
    item.status = 'cleaning'
    try {
      const arrayBuffer = await item.file.arrayBuffer()
      item.cleanedBlob = new Blob([arrayBuffer], { type: item.file.type || 'application/octet-stream' })
      item.status = 'cleaned'
      pushToast(`Файл «${item.file.name}» очищен (демо).`, 'success')
    } catch (error) {
      item.status = 'error'
      item.error = error instanceof Error ? error.message : String(error)
      pushToast(`Ошибка при очистке «${item.file.name}»: ${item.error}`, 'error')
    }
  }

  async function cleanAll() {
    for (const item of items.value) {
      if (item.status !== 'cleaned') {
        // eslint-disable-next-line no-await-in-loop
        await clean(item)
      }
    }
  }

  function download(item: QueueItem) {
    const blob = item.cleanedBlob ?? item.file
    const filename = `${item.file.name.replace(/(\.[^./]+)?$/, '')}_clean${item.file.name.match(/\.[^./]+$/)?.[0] ?? ''}`
    downloadBlob(blob, filename)
  }

  function downloadAll() {
    for (const item of items.value) {
      download(item)
    }
  }

  return {
    items,
    activeItem,
    metadata,
    cleanerOptions,
    toast,
    enqueue,
    inspect,
    clean,
    cleanAll,
    download,
    downloadAll,
    formatSize: formatBytes
  }
}
