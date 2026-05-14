<template>
  <div class="trip-detail-page">
    
    <LoadingOverlay v-if="isLoading" text="探索山林中..." />

    <template v-if="!isLoading">
      <header class="trip-hero" :style="heroStyle">
        <div class="container">
          <h1 v-if="errorMsg">{{ errorMsg }}</h1>
          <h1 v-else>{{ trip.title }}</h1>
          <p v-if="!errorMsg">{{ trip.semester }} 學期 | {{ trip.days }}</p>
        </div>
      </header>

      <main class="container trip-layout">
        <div class="trip-main-content">
          <h2>行程紀錄</h2>

          <section class="weather-section" v-if="hasWeather">
            <div class="weather-heading">
              <h3>天氣紀錄</h3>
              <span v-if="trip.weather.updatedAt">更新：{{ trip.weather.updatedAt }}</span>
            </div>
            <p class="weather-summary" v-if="trip.weather.summary">{{ trip.weather.summary }}</p>
            <div class="weather-grid">
              <div v-for="item in weatherItems" :key="item.label" class="weather-item">
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
              </div>
            </div>
            <p class="weather-note" v-if="trip.weather.note">{{ trip.weather.note }}</p>
            <p class="weather-source" v-if="trip.weather.source">資料來源：{{ trip.weather.source }}</p>
          </section>

          <div class="movement-legend-container" v-if="plan.length > 0">
            <span class="legend-title">移動方式：</span>
            <div class="legend-item">
              <span class="legend-line ride-line"></span>搭車
            </div>
            <div class="legend-item">
              <span class="legend-line heavy-line"></span>重裝
            </div>
            <div class="legend-item">
              <span class="legend-line light-line"></span>輕裝
            </div>
          </div>

          <div class="record-and-photo-layout">
            
            <div class="timeline-container">
              <p v-if="plan.length === 0" style="color: #999;">尚未建立詳細行程資料</p>

              <div v-for="(day, index) in plan" :key="index" class="day-group">
                <h3 class="day-title">{{ day.dayLabel }}</h3>
                
                <div class="timeline">
                  <div 
                    class="timeline-item" 
                    v-for="(item, idx) in day.items" 
                    :key="idx"
                    :class="'line-' + (item.type || 'light')" 
                  >
                    <div class="timeline-time">{{ item.time }}</div>
                    <div class="timeline-content">
                      <h4>{{ item.location }}</h4>
                      <div class="transit-info" v-if="item.info">
                        <span class="plain-info">{{ item.info }}</span>
                      </div>
                      <div class="timeline-photos" v-if="locationPhotos(item.location).length">
                        <button
                          v-for="photo in locationPhotos(item.location)"
                          :key="photo.docId"
                          class="timeline-photo"
                          type="button"
                          @click="openLightbox(photo)"
                        >
                          <img :src="photo.url" :alt="photo.caption || photo.location || '行程照片'" loading="lazy" />
                          <span v-if="photo.caption">{{ photo.caption }}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <TripSidebar :trip="trip" />
        
      </main>

      <Teleport to="body">
        <div class="lightbox" v-if="activePhoto" @click.self="closeLightbox">
          <button class="lightbox-close" @click="closeLightbox">✕</button>
          <img :src="activePhoto.url" :alt="activePhoto.caption || activePhoto.location || '行程照片'" />
          <p v-if="activePhoto.caption">{{ activePhoto.caption }}</p>
        </div>
      </Teleport>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from '../firebase';
import LoadingOverlay from '../components/LoadingOverlay.vue';
import TripSidebar from '../components/TripSidebar.vue';
import { preloadImages } from '../utils/preloadImages';

const route = useRoute();

const trip = ref({});
const plan = ref([]);
const photos = ref([]);
const isLoading = ref(true);
const errorMsg = ref('');
const activePhoto = ref(null);

const hasWeather = computed(() => {
  const weather = trip.value.weather || {};
  return ['summary', 'temperature', 'rainChance', 'wind', 'source', 'updatedAt', 'note']
    .some(key => Boolean(weather[key]));
});

const weatherItems = computed(() => {
  const weather = trip.value.weather || {};
  return [
    { label: '溫度', value: weather.temperature },
    { label: '降雨 / 雨況', value: weather.rainChance },
    { label: '風況', value: weather.wind },
  ].filter(item => item.value);
});

const heroStyle = computed(() => {
  if (trip.value.coverImage) {
    return { backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${trip.value.coverImage}')` };
  }
  return { backgroundColor: '#1A432D' }; 
});

onMounted(async () => {
  const tripId = route.query.id || 'hehuan-nw-2026';

  try {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('連線逾時')), 8000)
    );
    const docRef = doc(db, "trip", tripId);
    const docSnap = await Promise.race([getDoc(docRef), timeout]);

    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.status === 'draft') {
        errorMsg.value = "找不到這筆行程資料";
        return;
      }
      trip.value = data;
      plan.value = data.plan || [];
      await loadTripPhotos(tripId);
      await preloadImages([data.coverImage, ...photos.value.slice(0, 8).map(photo => photo.url)], { timeoutMs: 8000 });
    } else {
      errorMsg.value = "找不到這筆行程資料";
    }
  } catch (error) {
    console.error("Firebase 連線錯誤:", error);
    errorMsg.value = "資料讀取失敗，請檢查網路連線";
  } finally {
    setTimeout(() => {
      isLoading.value = false;
    }, 600);
  }
});

async function loadTripPhotos(tripId) {
  const q = query(collection(db, 'photos'), where('tripId', '==', tripId));
  const snap = await getDocs(q);
  photos.value = snap.docs
    .map(d => ({ docId: d.id, ...d.data() }))
    .sort((a, b) => {
      const aTime = a.uploadedAt?.toMillis?.() || 0;
      const bTime = b.uploadedAt?.toMillis?.() || 0;
      return bTime - aTime;
    });
}

function locationPhotos(location) {
  return photos.value.filter(photo => photo.location === location);
}

function openLightbox(photo) {
  activePhoto.value = photo;
}

function closeLightbox() {
  activePhoto.value = null;
}
</script>

<style scoped>
.container {
  max-width: 1300px;
  margin: 0 auto;
  padding: 0 40px; 
}

.trip-detail-page { padding-bottom: 60px; }

.trip-hero {
  height: 45vh; background-size: cover; background-position: center;
  display: flex; align-items: center; color: white;
}
.trip-hero h1 { font-size: 3.5rem; text-shadow: 2px 2px 8px rgba(0,0,0,0.5); }

.trip-layout { display: flex; gap: 50px; padding: 50px 0; }
.trip-main-content { flex: 2; }

.weather-section {
  background: #f8faf9;
  border: 1px solid #dfe8e2;
  border-left: 4px solid #E2C044;
  border-radius: 10px;
  padding: 20px;
  margin: 0 0 28px;
}

.weather-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.weather-heading h3 {
  color: #1A432D;
  margin: 0;
  font-size: 1.2rem;
}

.weather-heading span,
.weather-source {
  color: #78847d;
  font-size: 0.85rem;
}

.weather-summary {
  color: #334139;
  font-size: 1rem;
  margin: 0 0 14px;
  line-height: 1.7;
}

.weather-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.weather-item {
  background: white;
  border: 1px solid #edf1ee;
  border-radius: 8px;
  padding: 12px;
}

.weather-item span {
  color: #78847d;
  display: block;
  font-size: 0.78rem;
  margin-bottom: 4px;
}

.weather-item strong {
  color: #1A432D;
  font-size: 0.95rem;
  line-height: 1.5;
}

.weather-note {
  color: #4f5b54;
  margin: 14px 0 0;
  line-height: 1.7;
}

.weather-source {
  margin: 10px 0 0;
}

/* 🌟 左右雙欄排版設定 🌟 */
.record-and-photo-layout {
  display: flex;
  gap: 40px; 
  align-items: flex-start; 
}

.timeline-container {
  flex: 0 0 320px; 
}

.photo-area {
  flex: 1; 
}

/* ========================================== */

.movement-legend-container {
  display: flex; align-items: center; flex-wrap: wrap; gap: 20px;
  background: #f8faf9; padding: 15px 20px; border-radius: 8px;
  margin-bottom: 30px; border-left: 4px solid #1A432D;
}
.legend-title { font-weight: bold; color: #1A432D; }
.legend-item { display: flex; align-items: center; gap: 8px; font-weight: bold; color: #555; }
.legend-line { display: inline-block; height: 24px; }
.ride-line { border-left: 4px solid #f39c12; }
.heavy-line { border-left: 6px double #1A432D; }
.light-line { border-left: 2px solid #1A432D; }

.day-group { margin-bottom: 40px; }
.day-title { background: #1A432D; color: white; padding: 8px 18px; border-radius: 6px; display: inline-block; margin-bottom: 20px; }
.timeline { margin-left: 15px; }

.timeline-item { position: relative; padding-left: 35px; padding-bottom: 35px; }

.timeline-item::before {
  content: ''; position: absolute; left: 0; top: 0;
  width: 16px; height: 16px; background: #1A432D;
  border-radius: 50%; border: 3px solid white;
  transform: translateX(-50%); z-index: 2;
}

.timeline-item::after {
  content: ''; position: absolute; left: 0; top: 16px; bottom: 0;
  transform: translateX(-50%); z-index: 1;
}

.timeline-item.line-ride::after { border-left: 4px solid #f39c12; }
.timeline-item.line-ride::before { background: #f39c12; }
.timeline-item.line-heavy::after { border-left: 6px double #1A432D; }
.timeline-item.line-light::after { border-left: 2px solid #1A432D; }
.timeline-item:last-child::after { display: none; }

.timeline-time { font-weight: bold; color: #1A432D; font-size: 1.1rem; }
.timeline-content h4 { margin: 5px 0; font-size: 1.2rem; color: #333; }
.plain-info { font-size: 0.95rem; color: #666; margin-top: 2px; display: inline-block; }

.timeline-photos {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.timeline-photo {
  padding: 0;
  border: 1px solid #e4e8e6;
  border-radius: 8px;
  overflow: hidden;
  background: white;
  cursor: pointer;
  text-align: left;
}

.timeline-photo img {
  width: 100%;
  aspect-ratio: 4 / 3;
  display: block;
  object-fit: cover;
}

.timeline-photo span {
  display: block;
  padding: 8px 10px;
  color: #4f5b54;
  font-size: 0.82rem;
  line-height: 1.5;
}

.lightbox {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 22px;
}

.lightbox img {
  max-width: 92vw;
  max-height: 82vh;
  object-fit: contain;
  border-radius: 6px;
}

.lightbox p {
  color: rgba(255,255,255,0.85);
  margin-top: 12px;
}

.lightbox-close {
  position: fixed;
  top: 18px;
  right: 26px;
  border: none;
  background: transparent;
  color: white;
  font-size: 2rem;
  cursor: pointer;
}

/* 🌟 修正：清除了舊的 .trip-sidebar 相關 CSS，保持程式碼簡潔 */

@media (max-width: 900px) {
  .trip-layout { flex-direction: column; }
  .trip-hero h1 { font-size: 2.5rem; }
  
  .record-and-photo-layout {
    flex-direction: column; 
  }
  .timeline-container {
    flex: 1; 
    width: 100%; 
  }

  .weather-grid,
  .timeline-photos {
    grid-template-columns: 1fr;
  }
}
</style>
