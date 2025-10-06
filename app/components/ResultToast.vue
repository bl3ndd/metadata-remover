<script setup lang="ts">
const props = defineProps<{
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
}>()
</script>

<template>
  <n-alert :type="props.type ?? 'info'" :title="props.message" closable />
</template>
