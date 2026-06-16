import { DEFAULT_SHARE_IMAGE } from './src/utils/seoDefaults.js'

const SITE_URL = 'https://cymc2-7d93e.web.app/'
const SITE_NAME = '中原大學登山社'
const SITE_DESCRIPTION = '中原大學登山社官方網站，收錄社史、學期隊伍、行程回顧、照片與入社資訊。'
const SITE_KEYWORDS = '中原大學登山社,中原登山社,中原大學,登山社,登山活動,隊伍紀錄,登山行程'

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
      title: SITE_NAME,
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        {
          name: 'description',
          content: SITE_DESCRIPTION,
        },
        {
          name: 'keywords',
          content: SITE_KEYWORDS,
        },
        { name: 'author', content: SITE_NAME },
        { name: 'robots', content: 'index, follow' },
        { name: 'theme-color', content: '#1A432D' },
        { property: 'og:locale', content: 'zh_TW' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: SITE_URL },
        { property: 'og:site_name', content: SITE_NAME },
        { property: 'og:title', content: SITE_NAME },
        {
          property: 'og:description',
          content: SITE_DESCRIPTION,
        },
        { property: 'og:image', content: DEFAULT_SHARE_IMAGE },
        { property: 'og:image:alt', content: SITE_NAME },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: SITE_NAME },
        {
          name: 'twitter:description',
          content: SITE_DESCRIPTION,
        },
        { name: 'twitter:image', content: DEFAULT_SHARE_IMAGE },
      ],
      link: [
        { rel: 'canonical', href: SITE_URL },
        { rel: 'shortcut icon', href: '/favicon.ico?v=4' },
        { rel: 'icon', type: 'image/png', href: '/favicon.png?v=4' },
        { rel: 'apple-touch-icon', href: '/favicon.png?v=4' },
      ],
      script: [
        {
          type: 'application/ld+json',
          children: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            '@id': `${SITE_URL}#website`,
            name: SITE_NAME,
            alternateName: ['中原登山社', 'CYMC'],
            url: SITE_URL,
            inLanguage: 'zh-TW',
            publisher: {
              '@type': 'Organization',
              name: SITE_NAME,
              url: SITE_URL,
              logo: `${SITE_URL}favicon.png`,
            },
          }),
        },
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
      ],
    },
  },
})
