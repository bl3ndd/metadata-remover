<script setup lang="ts">
const props = defineProps<{
  disabled: boolean
}>()

const emit = defineEmits<{
  (e: 'clean-all'): void
  (e: 'download-all'): void
}>()
</script>

<template>
  <div class="batch-toolbar">
    <n-space>
      <n-button type="primary" :disabled="disabled" @click="emit('clean-all')">
        Очистить всё
      </n-button>
      <n-button type="success" :disabled="disabled" @click="emit('download-all')">
        Скачать всё
      </n-button>
    </n-space>
  </div>
</template>

<style scoped>
.batch-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}
</style>
