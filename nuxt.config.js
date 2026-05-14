export default defineNuxtConfig({
  ssr: false,
  srcDir: 'src/',
  devtools: { enabled: true },
  experimental: {
    appManifest: false,
    viteEnvironmentApi: true,
  },
  css: [
    '~/assets/main.css',
    'aos/dist/aos.css',
  ],
  app: {
    head: {
      htmlAttrs: {
        lang: 'zh-TW',
      },
      title: '中原大學登山社',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        {
          name: 'description',
          content: '中原大學登山社官方網站，收錄社史、學期隊伍、行程回顧、照片與入社資訊。',
        },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: '中原大學登山社' },
        { property: 'og:image', content: '/favicon.ico' },
        { name: 'twitter:card', content: 'summary' },
      ],
      link: [
        { rel: 'icon', href: '/favicon.ico' },
      ],
    },
  },
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: [
        '/',
        '/history',
        '/gallery',
        '/schedule',
        '/join',
        '/faq',
        '/trip',
        '/cymc-admin',
      ],
    },
  },
})
