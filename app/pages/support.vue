<template>
  <n-layout-content class="page">
    <h1>Поддержка</h1>
    <n-collapse>
      <n-collapse-item title="MetaClean не видит мои файлы" name="files">
        Убедитесь, что формат поддерживается (JPEG, PNG, WebP, PDF). Видео поддерживается в режиме чтения.
      </n-collapse-item>
      <n-collapse-item title="Как проверить работу офлайн?" name="offline">
        Установите PWA (иконка в адресной строке), затем выключите интернет и обновите страницу — приложение
        продолжит работу.
      </n-collapse-item>
      <n-collapse-item title="Планируется ли пакетная обработка?" name="batch">
        Да, в дорожной карте — расширенный batch-режим с параллельной обработкой и прогрессом.
      </n-collapse-item>
      <n-collapse-item title="Будет ли платный доступ?" name="billing">
        В MVP приложение бесплатное. Позже появится платная подписка для больших пакетов.
      </n-collapse-item>
    </n-collapse>
  </n-layout-content>
</template>

<style scoped>
.page {
  padding: 24px;
  display: grid;
  gap: 16px;
}
</style>
