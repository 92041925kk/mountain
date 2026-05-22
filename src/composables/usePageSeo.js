const BASE_TITLE = '中原大學登山社'
const BASE_DESCRIPTION = '中原大學登山社官方網站，收錄社史、學期隊伍、行程回顧、照片與入社資訊。'
const BASE_KEYWORDS = '中原大學登山社,中原登山社,中原大學,登山社,登山活動,隊伍紀錄,登山行程'
const DEFAULT_IMAGE = '/favicon.ico'

export function usePageSeo(title, description = BASE_DESCRIPTION, options = {}) {
  const pageTitle = title ? `${title} - ${BASE_TITLE}` : BASE_TITLE
  const image = options.image || DEFAULT_IMAGE
  const robots = options.robots || 'index, follow'

  useHead({
    title: pageTitle,
  })

  useSeoMeta({
    description,
    keywords: BASE_KEYWORDS,
    robots,
    ogLocale: 'zh_TW',
    ogSiteName: BASE_TITLE,
    ogType: options.type || 'website',
    ogTitle: pageTitle,
    ogDescription: description,
    ogImage: image,
    ogImageAlt: BASE_TITLE,
    twitterCard: image === DEFAULT_IMAGE ? 'summary' : 'summary_large_image',
    twitterTitle: pageTitle,
    twitterDescription: description,
    twitterImage: image,
  })
}
