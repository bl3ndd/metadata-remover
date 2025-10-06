<script setup lang="ts">
import { computed } from 'vue'
import type { QueueItem } from '@/composables/useFileQueue'

const props = defineProps<{
  item: QueueItem | null
}>()

const currentItem = computed(() => props.item)
const hasPreview = computed(() => Boolean(currentItem.value?.previewUrl))
</script>

<template>
  <div class="preview-pane">
    <template v-if="currentItem">
      <div class="preview-pane__header">
        <span class="preview-pane__name">{{ currentItem.file.name }}</span>
        <span class="preview-pane__details">{{ currentItem.kind }} · {{ currentItem.file.type }}</span>
      </div>
      <div v-if="hasPreview" class="preview-pane__media">
        <img
          v-if="currentItem.kind === 'image'"
          :src="currentItem.previewUrl || ''"
          alt="Предпросмотр изображения"
        />
        <embed
          v-else-if="currentItem.kind === 'pdf'"
          :src="currentItem.previewUrl || ''"
          type="application/pdf"
          class="preview-pane__pdf"
        />
        <video v-else-if="currentItem.kind === 'video'" :src="currentItem.previewUrl || ''" controls />
        <n-empty v-else description="Предпросмотр не поддерживается" />
      </div>
      <n-empty v-else description="Предпросмотр недоступен" />
    </template>
    <n-empty v-else description="Выберите файл для просмотра" />
  </div>
</template>

<style scoped>
.preview-pane {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-pane__header {
  display: flex;
  flex-direction: column;
}

.preview-pane__name {
  font-weight: 600;
}

.preview-pane__details {
  color: var(--n-text-color-3);
  font-size: 12px;
}

.preview-pane__media {
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.preview-pane__pdf,
.preview-pane__media > img,
.preview-pane__media > video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
