<template>
  <div class="home-page">
    
    <LoadingOverlay v-if="isLoading" text="正在探索山林..." />

    <div v-if="errorMsg && !isLoading" class="error-banner">
      <p>⚠️ {{ errorMsg }}</p>
      <button class="btn-retry" @click="$router.go(0)">重新載入</button>
    </div>

    <template v-if="!isLoading">
      <header class="hero" :style="heroStyle">
        <div class="hero-content">
          <h1>{{ siteSettings.homeHeroTitle }}</h1>
          <p>{{ siteSettings.homeHeroSubtitle }}</p>
          <a
            v-if="isExternalCta"
            :href="siteSettings.homeCtaPath"
            class="btn-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ siteSettings.homeCtaText }}
          </a>
          <router-link v-else :to="siteSettings.homeCtaPath || '/join'" class="btn-primary">
            {{ siteSettings.homeCtaText }}
          </router-link>
        </div>
      </header>

      <main class="container">
        <section class="intro-section" data-aos="fade-up">
          <h2>{{ siteSettings.homeIntroTitle }}</h2>
          <div class="divider"></div>
          <p class="intro-text">
            {{ siteSettings.homeIntroText }}
          </p>
        </section>

        <!-- 照片牆區塊 -->
        <section class="photo-wall-section" v-if="photos.length > 0" data-aos="fade-up">
          <h2>{{ siteSettings.homePhotoWallTitle }}</h2>
          <div class="divider"></div>
          <Transition name="photo-fade" mode="out-in">
            <div class="photo-grid" :key="currentPage">
              <div
                v-for="photo in displayedPhotos"
                :key="photo.url"
                class="photo-item"
                @click="openLightboxByUrl(photo.url)"
              >
                <img :src="photo.url" :alt="photo.caption || '山社照片'" loading="eager" decoding="async" @load="e => e.target.classList.add('loaded')" />
                <div class="photo-overlay" v-if="photo.caption"><span>{{ photo.caption }}</span></div>
              </div>
            </div>
          </Transition>
          <div class="view-all">
            <router-link to="/gallery" class="btn-outline">查看更多照片 →</router-link>
          </div>
        </section>

        <!-- Lightbox -->
        <Teleport to="body">
          <div class="lightbox" v-if="lightboxIndex !== null" @click.self="closeLightbox">
            <button class="lightbox-close" @click="closeLightbox">✕</button>
            <button class="lightbox-prev" @click="lightboxPrev" v-if="photos.length > 1">&#8249;</button>
            <img :src="photos[lightboxIndex].url" :alt="photos[lightboxIndex].caption || '山社照片'" />
            <p class="lightbox-caption" v-if="photos[lightboxIndex].caption">{{ photos[lightboxIndex].caption }}</p>
            <button class="lightbox-next" @click="lightboxNext" v-if="photos.length > 1">&#8250;</button>
          </div>
        </Teleport>

        <section class="recent-trips-section" v-if="upcomingTrips.length > 0" data-aos="fade-up">
          <h2>{{ siteSettings.homeRecentTripsTitle }}</h2>
          <div class="divider"></div>
          <div class="recent-trips-grid">
            <div 
              v-for="(trip, idx) in upcomingTrips" 
              :key="idx"
              class="recent-trip-card"
              data-aos="fade-up"
              :data-aos-delay="idx * 100"
            >
              <div class="recent-card-body">
                <span class="recent-tag">{{ trip.date }}</span>
                <h3>{{ trip.title }}</h3>
                <a 
                  v-if="isValidFacebookUrl(trip.facebook_url)"
                  :href="trip.facebook_url.trim()"
                  target="_blank" 
                  rel="noopener noreferrer" 
                  class="btn-fb"
                >查看 FB 貼文</a>
              </div>
            </div>
          </div>
          <div class="view-all">
            <router-link to="/schedule" class="btn-outline">查看完整行事曆 →</router-link>
          </div>
        </section>
      </main>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { getDownloadURL, ref as storageRef } from 'firebase/storage';
import { db, storage } from '../firebase';
import LoadingOverlay from '../components/LoadingOverlay.vue';
import { preloadImages } from '../utils/preloadImages';
import { defaultSiteSettings, getSiteSettings } from '../utils/siteSettings';

defineOptions({ name: 'Home' });

const isLoading = ref(true);
const errorMsg = ref('');
const upcomingTrips = ref([]);
const photos = ref([]);
const lightboxIndex = ref(null);
const currentPage = ref(0);
const heroImageUrl = ref('https://i.postimg.cc/RZgpMKth/20240421-053558(1)-(1).jpg');
const siteSettings = ref({ ...defaultSiteSettings });
let rotateTimer = null;
let isSwitchingPhotoPage = false;

const PHOTO_PAGE_SIZE = 6;

const isExternalCta = computed(() => /^https?:\/\//.test(siteSettings.value.homeCtaPath || ''));

const photoRotationMs = computed(() => {
  const seconds = Number(siteSettings.value.homePhotoRotationSeconds);
  return (Number.isFinite(seconds) ? seconds : defaultSiteSettings.homePhotoRotationSeconds) * 1000;
});

const heroStyle = computed(() => ({
  backgroundImage: `linear-gradient(rgba(26, 67, 45, 0.5), rgba(26, 67, 45, 0.5)), url("${heroImageUrl.value}")`,
}));

const displayedPhotos = computed(() => {
  return getPhotosForPage(currentPage.value);
});

function openLightboxByUrl(url) {
  const idx = photos.value.findIndex(p => p.url === url);
  if (idx !== -1) lightboxIndex.value = idx;
}
function closeLightbox() { lightboxIndex.value = null; }
function lightboxPrev() {
  lightboxIndex.value = (lightboxIndex.value - 1 + photos.value.length) % photos.value.length;
}
function lightboxNext() {
  lightboxIndex.value = (lightboxIndex.value + 1) % photos.value.length;
}

onUnmounted(() => { if (rotateTimer) clearInterval(rotateTimer); });

function getPhotosForPage(page) {
  const total = photos.value.length;
  if (total === 0) return [];

  const count = Math.min(PHOTO_PAGE_SIZE, total);
  if (total <= PHOTO_PAGE_SIZE) return photos.value.slice(0, count);

  return Array.from({ length: count }, (_, i) =>
    photos.value[(page * PHOTO_PAGE_SIZE + i) % total]
  );
}

function getUniquePhotos(items) {
  const seenUrls = new Set();
  return items.filter((item) => {
    if (!item?.url || seenUrls.has(item.url)) return false;
    seenUrls.add(item.url);
    return true;
  });
}

function isValidFacebookUrl(url) {
  return typeof url === 'string' && url.trim() !== '' && url.trim() !== '無';
}

async function loadHeroImage() {
  try {
    heroImageUrl.value = await getDownloadURL(storageRef(storage, siteSettings.value.homeHeroStoragePath));
  } catch (e) {
    console.warn('首頁封面圖載入失敗，使用備用圖片:', e);
  }
}

async function loadUpcomingTrips() {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('連線逾時')), 8000)
  );
  const docRef = doc(db, 'schedules', siteSettings.value.currentSemester);
  const docSnap = await Promise.race([getDoc(docRef), timeout]);

  if (docSnap.exists()) {
    const data = docSnap.data();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = (data.items || []).filter((item) => {
      const d = parseScheduleDate(item.date);
      return d && d >= today;
    });

    upcomingTrips.value = upcoming.slice(0, 3);
  }
}

async function loadPhotoWall() {
  try {
    const q = query(collection(db, 'photos'), orderBy('uploadedAt', 'desc'), limit(60));
    const snap = await getDocs(q);
    const allPhotos = getUniquePhotos(snap.docs.map(d => d.data()));
    const featuredPhotos = allPhotos
      .filter(photo => photo.homeFeatured)
      .sort((a, b) => (Number(a.homeOrder) || 9999) - (Number(b.homeOrder) || 9999));
    const source = siteSettings.value.homePhotoSource;
    const limitCount = Math.min(60, Math.max(6, Number(siteSettings.value.homePhotoLimit) || defaultSiteSettings.homePhotoLimit));

    photos.value = (source === 'featured' && featuredPhotos.length ? featuredPhotos : allPhotos).slice(0, limitCount);

    if (photos.value.length > PHOTO_PAGE_SIZE) {
      await preloadImages(getPhotosForPage(1).map(photo => photo.url), { timeoutMs: 6000 });
      rotateTimer = setInterval(showNextPhotoPage, photoRotationMs.value);
    }
  } catch (e) {
    console.warn('照片牆載入失敗:', e);
  }
}

async function showNextPhotoPage() {
  if (isSwitchingPhotoPage || photos.value.length <= PHOTO_PAGE_SIZE) return;
  isSwitchingPhotoPage = true;
  const nextPage = currentPage.value + 1;
  await preloadImages(getPhotosForPage(nextPage).map(photo => photo.url), { timeoutMs: 6000 });
  currentPage.value = nextPage;
  isSwitchingPhotoPage = false;
}

// 將行事曆的日期字串（如 "5/1-5/3"、"3/14"）解析成今年的 Date
function parseScheduleDate(dateStr) {
  // 取第一個日期部分，例如 "5/1-5/3" → "5/1"，"3/7-8" → "3/7"
  const firstPart = dateStr.split('-')[0].trim();
  const parts = firstPart.split('/');
  if (parts.length < 2) return null;
  const month = parseInt(parts[0], 10);
  const day = parseInt(parts[1], 10);
  if (isNaN(month) || isNaN(day)) return null;
  const now = new Date();
  return new Date(now.getFullYear(), month - 1, day);
}

onMounted(async () => {
  try {
    siteSettings.value = await getSiteSettings();
    await Promise.all([loadHeroImage(), loadUpcomingTrips(), loadPhotoWall()]);
    await preloadImages([
      heroImageUrl.value,
      ...displayedPhotos.value.map(photo => photo.url),
    ], { timeoutMs: 10000 });
  } catch (e) {
    console.error('首頁載入即將出發隊伍失敗:', e);
    errorMsg.value = '載入失敗，請檢查網路連線後重新整理';
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
/* 🌟 1. Hero 區塊優化 */
.hero {
  margin-top: 0;
  background-color: #1A432D;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  height: 70vh; /* 稍微調高一點，更有視覺衝擊力 */
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  text-align: center;
}

.hero-content {
  padding: 0 20px;
}

.hero h1 {
  font-size: clamp(2rem, 8vw, 3.5rem); /* RWD 字體大小自動縮放 */
  margin-bottom: 15px;
  letter-spacing: 4px;
  font-weight: 800;
  text-shadow: 0 4px 10px rgba(0,0,0,0.3);
}

.hero p {
  font-size: 1.2rem;
  margin-bottom: 40px;
  letter-spacing: 2px;
  opacity: 0.9;
}

/* 🌟 2. 加入按鈕樣式 */
.btn-primary {
  background-color: #E2C044; /* 山社金 */
  color: #1A432D; /* 山社綠 */
  padding: 14px 40px;
  text-decoration: none;
  border-radius: 30px;
  font-weight: bold;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(226, 192, 68, 0.4);
  display: inline-block;
}

.btn-primary:hover {
  background-color: #f0cc50;
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(226, 192, 68, 0.6);
}

/* 🌟 3. 介紹區塊 */
.intro-section {
  text-align: center;
  padding: 80px 20px;
  max-width: 800px;
  margin: 0 auto;
}

.intro-section h2 {
  color: #1A432D;
  font-size: 2rem;
  line-height: 1.3;
  margin-bottom: 15px;
  white-space: nowrap;
}

/* 點綴用的小裝飾線 */
.divider {
  width: 60px;
  height: 4px;
  background-color: #E2C044;
  margin: 0 auto 25px;
  border-radius: 2px;
}

.intro-text {
  font-size: 1.15rem;
  line-height: 1.8;
  color: #444;
}

/* 手機版適應 */
@media (max-width: 600px) {
  .hero { height: 60vh; }
  .intro-section { padding: 50px 20px; }
  .intro-section h2 { font-size: 1.55rem; }
  .recent-trips-grid { grid-template-columns: 1fr; }
}

@media (max-width: 360px) {
  .intro-section h2 { font-size: 1.35rem; }
}

/* 近期隊伍區塊 */
.recent-trips-section {
  text-align: center;
  padding: 0 20px 80px;
  max-width: 1000px;
  margin: 0 auto;
}

.recent-trips-section h2 {
  color: #1A432D;
  font-size: 2rem;
  margin-bottom: 15px;
}

.recent-trips-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 25px;
  margin-top: 10px;
  text-align: left;
}

.recent-trip-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  text-decoration: none;
  color: #333;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;
  border-left: 4px solid #E2C044;
}

.recent-trip-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
}

.recent-card-body {
  padding: 22px;
}

.recent-tag {
  background-color: #1A432D;
  color: white;
  font-size: 0.8rem;
  padding: 3px 10px;
  border-radius: 20px;
  font-weight: bold;
  letter-spacing: 0.5px;
}

.recent-card-body h3 {
  margin: 10px 0 6px;
  color: #1A432D;
  font-size: 1.2rem;
}

.recent-card-body p {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
}

.btn-fb {
  display: inline-block;
  margin-top: 10px;
  font-size: 0.85rem;
  color: #1877F2;
  text-decoration: none;
  font-weight: bold;
}

.btn-fb:hover {
  text-decoration: underline;
}

.view-all {
  margin-top: 35px;
}

.btn-outline {
  display: inline-block;
  text-decoration: none;
  color: #1A432D;
  border: 2px solid #1A432D;
  padding: 12px 30px;
  border-radius: 30px;
  font-weight: bold;
  transition: all 0.3s;
}

.btn-outline:hover {
  background-color: #1A432D;
  color: white;
}

@media (max-width: 900px) {
  .recent-trips-grid { grid-template-columns: repeat(2, 1fr); }
}

/* 照片牆 */
.photo-wall-section {
  text-align: center;
  padding: 0 20px 80px;
  max-width: 1100px;
  margin: 0 auto;
}

.photo-wall-section h2 {
  color: #1A432D;
  font-size: 2rem;
  margin-bottom: 15px;
}

/* Marquee 跑馬燈 */
.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 10px;
}

.photo-item {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 10px;
  cursor: pointer;
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease, opacity 0.4s ease;
  display: block;
  opacity: 0;
}
.photo-item img.loaded {
  opacity: 1;
}

.photo-item:hover img {
  transform: scale(1.06);
}

.photo-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.6));
  color: white;
  padding: 20px 12px 12px;
  font-size: 0.85rem;
  opacity: 0;
  transition: opacity 0.3s;
}

.photo-item:hover .photo-overlay {
  opacity: 1;
}

/* 照片淡入淡出切換 */
.photo-fade-enter-active,
.photo-fade-leave-active {
  transition: opacity 0.8s ease;
}
.photo-fade-enter-from,
.photo-fade-leave-to {
  opacity: 0;
}

/* Lightbox */
.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.92);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 20px;
}

.lightbox img {
  max-width: 90vw;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 6px;
}

.lightbox-caption {
  color: rgba(255,255,255,0.8);
  margin-top: 12px;
  font-size: 0.95rem;
}

.lightbox-close {
  position: fixed;
  top: 20px;
  right: 28px;
  background: none;
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  line-height: 1;
}

.lightbox-prev,
.lightbox-next {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255,255,255,0.15);
  border: none;
  color: white;
  font-size: 3rem;
  cursor: pointer;
  padding: 10px 18px;
  border-radius: 6px;
  line-height: 1;
  transition: background 0.2s;
}

.lightbox-prev { left: 16px; }
.lightbox-next { right: 16px; }

.lightbox-prev:hover,
.lightbox-next:hover {
  background: rgba(255,255,255,0.3);
}

@media (max-width: 600px) {
  .photo-grid { grid-template-columns: repeat(2, 1fr); }
  .lightbox-prev { left: 4px; }
  .lightbox-next { right: 4px; }
}
</style>
