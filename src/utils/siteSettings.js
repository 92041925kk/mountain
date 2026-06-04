import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const defaultSiteSettings = {
  siteTitle: '中原大學登山社',
  siteDescription: '走進山林，也走進一群一起前進的伙伴。',
  currentSemester: '114-2',
  homeHeroStoragePath: 'photos/home/20240421_0535581.jpg',
  homeHeroTitle: '來都來了，來爬山吧',
  homeHeroSubtitle: '一步一腳印，看見台灣之美',
  homeCtaText: '立即加入',
  homeCtaPath: '/join',
  homeIntroTitle: '歡迎來到中原大學登山社',
  homeIntroText: '我們是一群熱愛山林、挑戰自我的夥伴。在這裡，你可以找到志同道合的朋友，一起探索台灣的百岳與秘境。',
  homePhotoWallTitle: '山林回憶',
  homeRecentTripsTitle: '即將出發',
  homePhotoSource: 'latest',
  homePhotoLimit: 24,
  homePhotoRotationSeconds: 10,
  defaultPageHeaderImage: 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=2070',
  faqItems: [
    {
      q: '沒有登山經驗可以加入嗎？',
      a: '當然可以！我們大部分社員都是大學才開始爬山的，社團會安排循序漸進的行程，從郊山到中級山再到百岳，讓你慢慢累積經驗。',
    },
    {
      q: '體力不好怎麼辦？',
      a: '不用擔心，出隊前我們會有體能訓練和行前說明，讓你了解行程難度。平時多跑步、爬樓梯就是很好的準備，社團也會依行程分級，選擇適合自己的隊伍即可。',
    },
    {
      q: '需要自備裝備嗎？',
      a: '社團出隊會準備帳篷和炊具的部分，個人裝備像背包、頭燈和睡袋可以向社團租借，而私人物品像是登山鞋、衣物等建議自行準備。剛入社不用急著買，可以先跟社團租，確定有興趣再慢慢添購。',
    },
    {
      q: '社費包含哪些東西？',
      a: '社費 650 元，加入後終身是社員。繳納社費後會贈送社服一件以及精美頭巾一條，社費主要用於社團運作、公裝維護等費用。每次出隊會另外收取額外費用。',
    },
    {
      q: '出隊頻率大概多久一次？',
      a: '學期中大約每 2～3 週出隊一次，寒暑假會有較長天數的縱走行程。你可以依自己的時間選擇參加，不需要每次都到。',
    },
    {
      q: '爬山危險嗎？安全措施有哪些？',
      a: '安全是我們最重視的事。每次出隊都會有經驗豐富的幹部帶隊、投保登山險、攜帶急救包與衛星通訊設備，並事前完成入山入園申請。行前也會有詳細的行程說明與天氣評估。',
    },
    {
      q: '大幾都可以加入嗎？研究生也可以嗎？',
      a: '只要是中原大學在學學生都歡迎加入，不限年級，研究生也沒問題！',
    },
    {
      q: '如何報名參加出隊？',
      a: '每次出隊會在 Facebook 社團和 LINE 群組公告，有興趣的話直接在上面報名即可。也可以關注我們的 IG 獲得最新消息。',
    },
  ],
};

let cachedSettings = null;

export async function getSiteSettings(options = {}) {
  if (cachedSettings && !options.force) return cachedSettings;

  try {
    const snap = await getDoc(doc(db, 'settings', 'site'));
    cachedSettings = snap.exists()
      ? { ...defaultSiteSettings, ...snap.data() }
      : { ...defaultSiteSettings };
  } catch (e) {
    console.warn('網站設定載入失敗，使用預設設定:', e);
    cachedSettings = { ...defaultSiteSettings };
  }

  return cachedSettings;
}

export function clearSiteSettingsCache() {
  cachedSettings = null;
}
