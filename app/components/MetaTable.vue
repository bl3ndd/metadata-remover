<script setup lang="ts">
import { computed } from 'vue'
import type { NormalizedMetadata } from '@/composables/useMetadata'

const props = defineProps<{
  metadata: NormalizedMetadata | null
}>()

const groups = computed(() => Object.entries(props.metadata ?? {}))
</script>

<template>
  <div class="meta-table">
    <n-empty v-if="!metadata" description="Метаданные не загружены" />
    <template v-else>
      <section v-for="[group, entries] in groups" :key="group" class="meta-table__group">
        <h3 class="meta-table__heading">{{ group }}</h3>
        <n-table size="small" :single-line="false">
          <tbody>
            <tr v-for="(value, key) in entries" :key="key">
              <th scope="row">{{ key }}</th>
              <td>{{ value }}</td>
            </tr>
          </tbody>
        </n-table>
      </section>
    </template>
  </div>
</template>

<style scoped>
.meta-table {
  display: grid;
  gap: 16px;
}

.meta-table__group {
  display: grid;
  gap: 8px;
}

.meta-table__heading {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
}

th {
  width: 180px;
  text-align: left;
  vertical-align: top;
  color: var(--n-text-color-3);
}

td {
  white-space: pre-wrap;
}
</style>
