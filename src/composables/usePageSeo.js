const BASE_TITLE = '中原大學登山社'
const BASE_DESCRIPTION = '中原大學登山社官方網站，收錄社史、學期隊伍、行程回顧、照片與入社資訊。'

export function usePageSeo(title, description = BASE_DESCRIPTION) {
  const pageTitle = title ? `${title} - ${BASE_TITLE}` : BASE_TITLE

  useHead({
    title: pageTitle,
  })

  useSeoMeta({
    description,
    ogTitle: pageTitle,
    ogDescription: description,
    twitterTitle: pageTitle,
    twitterDescription: description,
  })
}
