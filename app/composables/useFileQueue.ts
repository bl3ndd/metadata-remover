import { computed, reactive, ref } from 'vue'
import { nanoid } from 'nanoid/non-secure'
import type { NormalizedMetadata, SupportedKind } from './useMetadata'
import { useMetadata } from './useMetadata'
import { downloadBlob } from '@/utils/blob'
import { formatBytes } from '@/utils/sanitize'

interface WorkerResponse {
  buffer: ArrayBuffer
  mimeType: string
}

type CleanerOptions = Record<string, unknown>

const imageWorkerUrl = import.meta.client
  ? new URL('@/workers/imageWorker.ts', import.meta.url)
  : null
const pdfWorkerUrl = import.meta.client
  ? new URL('@/workers/pdfWorker.ts', import.meta.url)
  : null
const videoWorkerUrl = import.meta.client
  ? new URL('@/workers/videoWorker.ts', import.meta.url)
  : null

async function runWorker<T extends WorkerResponse>(
  url: URL | null,
  payload: Record<string, unknown>,
  transfer: ArrayBuffer[] = []
): Promise<T> {
  if (!url) throw new Error('Воркеры доступны только в браузере')
  return new Promise((resolve, reject) => {
    const worker = new Worker(url, { type: 'module' })

    worker.onmessage = (event) => {
      const data = event.data as { type: string; message?: string } & Partial<T>
      if (data.type === 'result') {
        worker.terminate()
        resolve(data as T)
      } else if (data.type === 'error') {
        worker.terminate()
        reject(new Error(data.message || 'Неизвестная ошибка воркера'))
      }
    }

    worker.onerror = (error) => {
      worker.terminate()
      reject(error instanceof Error ? error : new Error(String(error)))
    }

    worker.postMessage(payload, transfer)
  })
}

async function cleanWithWorker(
  kind: SupportedKind,
  file: File,
  options: CleanerOptions
): Promise<WorkerResponse> {
  const buffer = await file.arrayBuffer()
  const payload = {
    id: nanoid(),
    name: file.name,
    type: file.type,
    buffer,
    options
  }
  if (kind === 'image') {
    return await runWorker(imageWorkerUrl, payload, [buffer])
  }
  if (kind === 'pdf') {
    return await runWorker(pdfWorkerUrl, payload, [buffer])
  }
  if (kind === 'video') {
    return await runWorker(videoWorkerUrl, payload, [buffer])
  }
  throw new Error('Очистка данного типа файлов не поддерживается')
}

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
      const options = cleanerOptions[item.id] ?? {}
      const response = await cleanWithWorker(item.kind, item.file, options)
      const mimeType = response.mimeType || item.file.type || 'application/octet-stream'
      item.cleanedBlob = new Blob([response.buffer], { type: mimeType })
      item.status = 'cleaned'
      pushToast(`Файл «${item.file.name}» очищен.`, 'success')
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
