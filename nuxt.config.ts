// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@unocss/nuxt',
    'shadcn-nuxt',
    '@vueuse/nuxt',
    '@nuxt/eslint',
    '@nuxt/icon',
    '@pinia/nuxt',
    '@nuxtjs/color-mode',
    '@nuxthub/core',
  ],

  css: [
    '@unocss/reset/tailwind.css',
  ],

  colorMode: {
    classSuffix: '',
  },

  features: {
    // For UnoCSS
    inlineStyles: false,
  },

  eslint: {
    config: {
      standalone: false,
    },
  },

  routeRules: {
    '/components': { redirect: '/components/accordion' },
    '/services': { redirect: '/services/borrow' },
    // '/services': { redirect: '/services/return' },
    '/settings': { redirect: '/settings/profile' },
  },

  imports: {
    dirs: [
      './lib',
    ],
  },

  runtimeConfig: {
    public: {
      // apiBase: 'https://solid-umbrella-rx7pxwgrrjj2xr9w-5000.app.github.dev/api',
      // apiBase: 'https://hhhpoltek.sgp.dom.my.id/api',
      apiBase: 'http://170.64.137.197:5123/api',
    },
  },
  compatibilityDate: '2025-12-14',
})
