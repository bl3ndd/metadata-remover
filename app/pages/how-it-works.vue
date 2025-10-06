<template>
  <n-layout-content class="page">
    <h1>Как это работает</h1>
    <n-list bordered>
      <n-list-item>
        <strong>Изображения (JPEG/PNG/WebP)</strong> — чтение EXIF, XMP, IPTC, ICC с помощью exifr; очистка EXIF/XMP/IPTC через piexifjs и кастомные утилиты.
      </n-list-item>
      <n-list-item>
        <strong>PDF</strong> — чтение и правка полей Info и XMP через pdf-lib.
      </n-list-item>
      <n-list-item>
        <strong>Видео (MP4/MOV)</strong> — анализ атомов QuickTime при помощи mp4box.js (в режиме чтения).
      </n-list-item>
      <n-list-item>
        Все операции выполняются локально в воркерах, UI остаётся отзывчивым даже при обработке батчей.
      </n-list-item>
      <n-list-item>
        PWA обеспечивает офлайн-режим, файлы не покидают браузер, статические ресурсы кэшируются.
      </n-list-item>
    </n-list>
  </n-layout-content>
</template>

<style scoped>
.page {
  padding: 24px;
  display: grid;
  gap: 16px;
}
</style>
