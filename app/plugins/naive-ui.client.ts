import { defineNuxtPlugin } from '#app'
import {
  create,
  NAlert,
  NButton,
  NCheckbox,
  NCollapse,
  NCollapseItem,
  NEmpty,
  NFormItem,
  NInput,
  NLayoutContent,
  NList,
  NListItem,
  NTable,
  NSpace
} from 'naive-ui'

export default defineNuxtPlugin((nuxtApp) => {
  const naive = create({
    components: [
      NAlert,
      NButton,
      NCheckbox,
      NCollapse,
      NCollapseItem,
      NEmpty,
      NFormItem,
      NInput,
      NLayoutContent,
      NList,
      NListItem,
      NTable,
      NSpace
    ]
  })

  nuxtApp.vueApp.use(naive)
})
