<script setup lang="ts">
import { computed } from 'vue'
import type { QueueItem, QueueStatus } from '@/composables/useFileQueue'
import { formatBytes } from '@/utils/sanitize'

const props = defineProps<{
  items: QueueItem[]
}>()

const emit = defineEmits<{
  (e: 'inspect', item: QueueItem): void
  (e: 'clean', item: QueueItem): void
  (e: 'download', item: QueueItem): void
}>()

const statusLabels: Record<QueueStatus, string> = {
  idle: 'В очереди',
  parsing: 'Чтение метаданных',
  parsed: 'Готово к очистке',
  cleaning: 'Очистка…',
  cleaned: 'Очищен',
  error: 'Ошибка'
}

const hasItems = computed(() => props.items.length > 0)

function prettyType(item: QueueItem) {
  if (item.kind === 'unknown') return item.file.type || 'Неизвестно'
  if (item.kind === 'image') return 'Изображение'
  if (item.kind === 'pdf') return 'PDF'
  if (item.kind === 'video') return 'Видео'
  return item.file.type || 'Неизвестно'
}

function statusLabel(item: QueueItem) {
  return statusLabels[item.status]
}

function prettySize(item: QueueItem) {
  return formatBytes(item.file.size)
}
</script>

<template>
  <div class="file-queue">
    <n-empty v-if="!hasItems" description="Нет файлов в очереди" />
    <n-list v-else bordered>
      <n-list-item v-for="item in props.items" :key="item.id">
        <div class="file-queue__row">
          <div class="file-queue__meta">
            <div class="file-queue__name">{{ item.file.name }}</div>
            <div class="file-queue__details">
              {{ prettyType(item) }} · {{ prettySize(item) }} · {{ statusLabel(item) }}
            </div>
          </div>
          <div class="file-queue__actions">
            <n-button size="small" @click="emit('inspect', item)">Просмотр</n-button>
            <n-button size="small" type="primary" @click="emit('clean', item)">Очистить</n-button>
            <n-button
              size="small"
              type="success"
              :disabled="!item.cleanedBlob"
              @click="emit('download', item)"
            >
              Скачать
            </n-button>
          </div>
        </div>
      </n-list-item>
    </n-list>
  </div>
</template>

<style scoped>
.file-queue__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.file-queue__meta {
  min-width: 0;
}

.file-queue__name {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-queue__details {
  color: var(--n-text-color-3);
  font-size: 12px;
}

.file-queue__actions {
  display: flex;
  gap: 8px;
}
</style>
