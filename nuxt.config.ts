import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  srcDir: "app",
  modules: ["@vite-pwa/nuxt", "@pinia/nuxt", "@vueuse/nuxt"],
  // css: ['naive-ui/dist/naive-ui.css'],
  typescript: {
    strict: true,
    shim: false,
  },
  devtools: { enabled: true },
  app: {
    head: {
      title: "MetaClean — офлайн-очистка метаданных",
      meta: [
        {
          name: "description",
          content:
            "Удаляйте EXIF, XMP, IPTC и PDF-метаданные локально в вашем браузере.",
        },
        { property: "og:title", content: "MetaClean" },
        {
          property: "og:description",
          content:
            "PWA для локальной очистки метаданных изображений, PDF и видео без загрузки на сервер.",
        },
      ],
    },
  },
  pwa: {
    registerType: "autoUpdate",
    manifest: {
      name: "MetaClean",
      short_name: "MetaClean",
      description: "Офлайн-очистка EXIF/XMP/IPTC/PDF метаданных в браузере.",
      display: "standalone",
      background_color: "#111827",
      theme_color: "#2563eb",
    },
    workbox: {
      navigateFallback: "/",
    },
  },
});
