<script setup lang="ts">
import { computed } from 'vue'
import DropZone from '@/components/DropZone.vue'
import FileQueue from '@/components/FileQueue.vue'
import PreviewPane from '@/components/PreviewPane.vue'
import MetaTable from '@/components/MetaTable.vue'
import CleanerControls from '@/components/CleanerControls.vue'
import BatchToolbar from '@/components/BatchToolbar.vue'
import ResultToast from '@/components/ResultToast.vue'
import { useFileQueue } from '@/composables/useFileQueue'

const queue = useFileQueue()
const { items, activeItem, metadata, cleanerOptions, toast } = queue

const activeOptions = computed({
  get: () => {
    const current = activeItem.value
    if (!current) return {}
    return cleanerOptions[current.id] ?? {}
  },
  set: (value: Record<string, unknown>) => {
    const current = activeItem.value
    if (!current) return
    cleanerOptions[current.id] = value
  }
})

function handleFiles(files: File[]) {
  queue.enqueue(files)
}
</script>

<template>
  <n-layout-content class="page">
    <div class="page__header">
      <div>
        <h1>MetaClean</h1>
        <p class="page__subtitle">Офлайн-очистка метаданных EXIF/XMP/IPTC/PDF в браузере</p>
      </div>
      <BatchToolbar :disabled="!items.length" @clean-all="queue.cleanAll" @download-all="queue.downloadAll" />
    </div>

    <DropZone class="page__dropzone" @files="handleFiles" />

    <div class="page__content">
      <div class="page__left">
        <FileQueue
          :items="items"
          @inspect="queue.inspect"
          @clean="queue.clean"
          @download="queue.download"
        />
      </div>
      <div class="page__right">
        <PreviewPane :item="activeItem" />
        <CleanerControls v-if="activeItem" :kind="activeItem.kind" v-model="activeOptions" />
        <MetaTable :metadata="metadata" />
      </div>
    </div>

    <transition-group name="toast" tag="div" class="page__toasts">
      <ResultToast
        v-for="item in toast.list"
        :key="item.id"
        :message="item.message"
        :type="item.type"
      />
    </transition-group>
  </n-layout-content>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
}

.page__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.page__subtitle {
  color: var(--n-text-color-3);
}

.page__dropzone {
  width: 100%;
}

.page__content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.page__left,
.page__right {
  display: grid;
  gap: 16px;
}

.page__toasts {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: grid;
  gap: 12px;
}

@media (max-width: 960px) {
  .page__content {
    grid-template-columns: 1fr;
  }
}
</style>
