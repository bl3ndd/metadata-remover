<script setup lang="ts">
const props = defineProps<{
  kind: 'image' | 'pdf' | 'video' | 'unknown'
  modelValue?: Record<string, unknown>
}>()

const emit = defineEmits<{ (e: 'update:modelValue', value: Record<string, unknown>): void }>()

function updateFlag(key: string, value: unknown) {
  emit('update:modelValue', { ...(props.modelValue ?? {}), [key]: value })
}
</script>

<template>
  <div class="cleaner-controls" v-if="kind !== 'unknown'">
    <template v-if="kind === 'image'">
      <n-checkbox
        :checked="Boolean(modelValue?.removeExif)"
        @update:checked="updateFlag('removeExif', $event)"
      >
        Удалить EXIF
      </n-checkbox>
      <n-checkbox
        :checked="Boolean(modelValue?.removeXmp)"
        @update:checked="updateFlag('removeXmp', $event)"
      >
        Удалить XMP/IPTC
      </n-checkbox>
      <n-checkbox
        :checked="Boolean(modelValue?.keepIcc ?? true)"
        @update:checked="updateFlag('keepIcc', $event)"
      >
        Сохранить ICC
      </n-checkbox>
      <n-checkbox
        :checked="Boolean(modelValue?.resetOrientation)"
        @update:checked="updateFlag('resetOrientation', $event)"
      >
        Сбросить ориентацию
      </n-checkbox>
    </template>
    <template v-else-if="kind === 'pdf'">
      <n-form-item label="Автор">
        <n-input :value="(modelValue?.author as string) || ''" @update:value="updateFlag('author', $event)" />
      </n-form-item>
      <n-form-item label="Название">
        <n-input :value="(modelValue?.title as string) || ''" @update:value="updateFlag('title', $event)" />
      </n-form-item>
      <n-form-item label="Ключевые слова">
        <n-input
          :value="(modelValue?.keywords as string) || ''"
          @update:value="updateFlag('keywords', $event)"
        />
      </n-form-item>
      <n-button
        tertiary
        @click="emit('update:modelValue', { ...(modelValue ?? {}), author: '', title: '', keywords: '' })"
      >
        Очистить Info/XMP
      </n-button>
    </template>
    <template v-else>
      <n-alert type="info" title="Видео">
        Очистка видео пока не поддерживается. Отображаем только найденные метаданные.
      </n-alert>
    </template>
  </div>
  <n-empty v-else description="Формат файла не поддерживается" />
</template>

<style scoped>
.cleaner-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
