import { DEFAULT_SHARE_IMAGE } from './src/utils/seoDefaults.js'

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
        {
          name: 'keywords',
          content: '中原大學登山社,中原登山社,中原大學,登山社,登山活動,隊伍紀錄,登山行程',
        },
        { name: 'author', content: '中原大學登山社' },
        { name: 'robots', content: 'index, follow' },
        { name: 'theme-color', content: '#1A432D' },
        { property: 'og:locale', content: 'zh_TW' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: '中原大學登山社' },
        { property: 'og:title', content: '中原大學登山社' },
        {
          property: 'og:description',
          content: '中原大學登山社官方網站，收錄社史、學期隊伍、行程回顧、照片與入社資訊。',
        },
        { property: 'og:image', content: DEFAULT_SHARE_IMAGE },
        { property: 'og:image:alt', content: '中原大學登山社' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: '中原大學登山社' },
        {
          name: 'twitter:description',
          content: '中原大學登山社官方網站，收錄社史、學期隊伍、行程回顧、照片與入社資訊。',
        },
        { name: 'twitter:image', content: DEFAULT_SHARE_IMAGE },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png?v=2' },
        { rel: 'apple-touch-icon', href: '/favicon.png?v=2' },
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
