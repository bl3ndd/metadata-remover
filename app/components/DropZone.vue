<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{ (e: 'files', files: File[]): void }>()

const inputRef = ref<HTMLInputElement | null>(null)

function triggerSelect() {
  inputRef.value?.click()
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  const files = event.dataTransfer?.files ? Array.from(event.dataTransfer.files) : []
  if (files.length) emit('files', files)
}

function onChange(event: Event) {
  const target = event.target as HTMLInputElement | null
  if (!target?.files) return
  emit('files', Array.from(target.files))
  target.value = ''
}
</script>

<template>
  <div
    class="dz"
    role="button"
    tabindex="0"
    @click="triggerSelect"
    @keyup.enter.prevent="triggerSelect"
    @dragover.prevent
    @drop="onDrop"
  >
    <slot>
      <span class="dz__text">Перетащите файлы сюда или нажмите, чтобы выбрать</span>
    </slot>
    <input
      ref="inputRef"
      type="file"
      multiple
      class="dz__input"
      @change="onChange"
    />
  </div>
</template>

<style scoped>
.dz {
  border: 1px dashed var(--n-border-color);
  padding: 24px;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.dz:focus-visible {
  outline: 2px solid var(--n-primary-color);
  outline-offset: 4px;
}

.dz__input {
  display: none;
}

.dz__text {
  color: var(--n-text-color);
}
</style>
