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
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="photo-area" v-if="trip.photos && trip.photos.length > 0">
            </div>

          </div>
        </div>

        <TripSidebar :trip="trip" />
        
      </main>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { doc, getDoc } from "firebase/firestore";
import { db } from '../firebase';
import LoadingOverlay from '../components/LoadingOverlay.vue';
import TripSidebar from '../components/TripSidebar.vue';

const route = useRoute();

const trip = ref({});
const plan = ref([]);
const isLoading = ref(true);
const errorMsg = ref('');

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
      trip.value = data;
      plan.value = data.plan || [];
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
}
</style>