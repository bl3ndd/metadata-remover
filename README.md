# MetaClean

MetaClean — PWA утилита для офлайн-очистки метаданных изображений (EXIF, XMP, IPTC) и PDF-документов. Приложение
работает локально в браузере на базе Nuxt 3 и Naive UI.

## Возможности

- Drag & drop / выбор файлов (JPEG, PNG, WebP, PDF, MP4/MOV в режиме чтения).
- Просмотр метаданных и превью файлов.
- Очистка изображений (EXIF/XMP/IPTC) и PDF (Info/XMP) c настройками.
- Пакетная обработка с базовым управлением.
- PWA-режим с офлайн-доступом, без сетевых запросов к сторонним сервисам.

## Структура

```
app/
  components/
  composables/
  pages/
  utils/
  workers/
nuxt.config.ts
```

## Запуск

```bash
pnpm install
pnpm dev
```

Готовая сборка: `pnpm build`.

## Лицензия

MIT
