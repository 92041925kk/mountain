<template>
  <div class="home-page">
    
    <LoadingOverlay v-if="isLoading" text="正在探索山林..." />

    <div v-if="errorMsg && !isLoading" class="error-banner">
      <p>⚠️ {{ errorMsg }}</p>
      <button class="btn-retry" @click="$router.go(0)">重新載入</button>
    </div>

    <template v-if="!isLoading">
      <header class="hero">
        <div class="hero-content">
          <h1>來都來了，來爬山吧</h1>
          <p>一步一腳印，看見台灣之美</p>
          <router-link to="/join" class="btn-primary">立即加入</router-link>
        </div>
      </header>

      <main class="container">
        <section class="intro-section" data-aos="fade-up">
          <h2>歡迎來到中原大學登山社</h2>
          <div class="divider"></div>
          <p class="intro-text">
            我們是一群熱愛山林、挑戰自我的夥伴。在這裡，你可以找到志同道合的朋友，一起探索台灣的百岳與秘境。
          </p>
        </section>

        <!-- 照片牆區塊 -->
        <section class="photo-wall-section" v-if="photos.length > 0" data-aos="fade-up">
          <h2>山林回憶</h2>
          <div class="divider"></div>
          <Transition name="photo-fade" mode="out-in">
            <div class="photo-grid" :key="currentPage">
              <div
                v-for="(photo, idx) in displayedPhotos"
                :key="idx"
                class="photo-item"
                @click="openLightboxByUrl(photo.url)"
              >
                <img :src="photo.url" :alt="photo.caption || '山社照片'" loading="lazy" @load="e => e.target.classList.add('loaded')" />
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
          <h2>即將出發</h2>
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
                  v-if="trip.facebook_url && trip.facebook_url !== '無'" 
                  :href="trip.facebook_url" 
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
import { db } from '../firebase';
import LoadingOverlay from '../components/LoadingOverlay.vue';

defineOptions({ name: 'Home' });

const isLoading = ref(true);
const errorMsg = ref('');
const upcomingTrips = ref([]);
const photos = ref([]);
const lightboxIndex = ref(null);
const currentPage = ref(0);
let rotateTimer = null;

// 每次顯示 6 張，用 modulo 讓圖片序列循環
const displayedPhotos = computed(() => {
  const total = photos.value.length;
  if (total === 0) return [];
  return Array.from({ length: 6 }, (_, i) =>
    photos.value[(currentPage.value * 6 + i) % total]
  );
});

function openLightbox(idx) { lightboxIndex.value = idx; }
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
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('連線逾時')), 8000)
    );
    const docRef = doc(db, 'schedules', '114-2');
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
    // 載入照片牆（最多 24 張，不足時輪迴補齊）
    try {
      const q = query(collection(db, 'photos'), orderBy('uploadedAt', 'desc'), limit(24));
      const snap = await getDocs(q);
      const raw = snap.docs.map(d => d.data());
      if (raw.length > 0) {
        let filled = [...raw];
        while (filled.length < 24) filled = [...filled, ...raw];
        photos.value = filled.slice(0, 24);
        // 每 6 秒切換下一批
        rotateTimer = setInterval(() => { currentPage.value++; }, 6000);
      }
    } catch (e) {
      console.warn('照片牆載入失敗:', e);
    }
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
  /* 使用你提供的絕美山照作為背景 */
  background: linear-gradient(rgba(26, 67, 45, 0.5), rgba(26, 67, 45, 0.5)), 
              url('https://i.postimg.cc/RZgpMKth/20240421-053558(1)-(1).jpg') center/cover no-repeat;
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
  margin-bottom: 15px;
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
  .recent-trips-grid { grid-template-columns: 1fr; }
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