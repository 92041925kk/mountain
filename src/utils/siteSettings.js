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
