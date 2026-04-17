<template>
  <div class="schedule-page">
    
    <LoadingOverlay v-if="isLoading" text="載入行事曆中..." />

    <template v-if="!isLoading">
      <header class="page-header">
        <div class="container">
          <h1>{{ scheduleData.title || '學期行事曆' }}</h1>
          <p>一步一腳印，開啟本學期的冒險旅程</p>
        </div>
      </header>

      <main class="container">
        <div class="schedule-list">
          
          <div v-if="!scheduleData.items || scheduleData.items.length === 0" class="no-data">
            <p>目前尚未發布任何行程。</p>
          </div>

          <div 
            v-for="(item, index) in scheduleData.items" 
            :key="index" 
            class="schedule-card"
          >
            <div class="card-header" @click="toggleDropdown(index)">
              <div class="date-side">
                <span class="date-text">{{ item.date }}</span>
              </div>
              
              <div class="info-side">
                <div class="title-with-icon">
                  <h3>{{ item.title }}</h3>
                  
                  <a 
                    v-if="item.facebook_url" 
                    :href="item.facebook_url" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    class="fb-link"
                    @click.stop
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" class="fb-icon">
                      <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                </div>
              </div>

              <div class="toggle-arrow" :class="{ 'is-open': activeIndex === index }">
                ▼
              </div>
            </div>

            <div class="card-body" v-show="activeIndex === index">
              <div class="description-content">
                <p>{{ item.description || '目前還沒有隊伍簡介喔！快點擊 FB 連結了解更多。' }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="notice-box">
          <p>＊以上行程可能依天氣或報名人數進行調整，請以社課公告為準。</p>
        </div>
      </main>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { doc, getDoc } from "firebase/firestore";
import { db } from '../firebase';
import LoadingOverlay from '../components/LoadingOverlay.vue';

// --- 狀態控制 ---
const scheduleData = ref({ items: [] });
const isLoading = ref(true);
const activeIndex = ref(null); 

// --- 切換下拉功能 ---
const toggleDropdown = (index) => {
  activeIndex.value = activeIndex.value === index ? null : index;
};

// --- 初始化抓取資料 ---
onMounted(async () => {
  try {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('連線逾時')), 8000)
    );
    const docRef = doc(db, "schedules", "114-2"); 
    const docSnap = await Promise.race([getDoc(docRef), timeout]);
    if (docSnap.exists()) {
      scheduleData.value = docSnap.data();
    }
  } catch (error) {
    console.error("Firebase 連線錯誤:", error);
  } finally {
    setTimeout(() => {
      isLoading.value = false;
    }, 600);
  }
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap');

/* 1. 基本頁面樣式 */
.schedule-page { padding-bottom: 80px; } 

/* 2. 標題區 */
.page-header {
  background: linear-gradient(rgba(26, 67, 45, 0.8), rgba(26, 67, 45, 0.8)), url('https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=2070');
  background-size: cover; background-position: center;
  color: white; text-align: center; padding: 60px 20px; margin-bottom: 40px;
}
.page-header h1 { font-size: 2.5rem; margin-bottom: 10px; letter-spacing: 2px; }

/* 3. 卡片網格與樣式 */
.schedule-list { display: flex; flex-direction: column; gap: 20px; }

.schedule-card {
  display: flex; flex-direction: column;
  background: white; border-radius: 12px; overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  border: 1px solid #eaeaea;
  border-left: 5px solid transparent; 
  transition: transform 0.3s, box-shadow 0.3s, border-left-color 0.3s;
}

.schedule-card:hover {
  transform: translateX(10px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  border-left-color: #E2C044; 
}

/* 4. 卡片內容細節 */
.card-header { display: flex; cursor: pointer; width: 100%; }

.date-side {
  background: #1A432D; color: white; width: 140px;
  display: flex; align-items: center; justify-content: center;
  font-weight: bold; font-size: 1.2rem; padding: 20px; text-align: center;
}

.info-side { padding: 25px 20px; display: flex; align-items: center; flex: 1; }

.title-with-icon {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; min-height: 32px;
}

.info-side h3 { margin: 0; color: #333; font-size: 1.3rem; }

/* 5. 互動元素 */
.fb-link { display: flex; align-items: center; transition: transform 0.2s; }
.fb-link:hover { transform: scale(1.15); }
.fb-icon { width: 26px; height: 26px; display: block; }

.toggle-arrow {
  display: flex; align-items: center; justify-content: center;
  padding: 0 20px; color: #1A432D; font-size: 1.2rem;
  transition: transform 0.3s ease;
}
.toggle-arrow.is-open { transform: rotate(180deg); color: #E2C044; }

/* 6. 下拉簡介區樣式 */
.card-body { background-color: #fcfdfc; border-top: 1px dashed #eaeaea; }
.description-content { 
  padding: 20px 25px; 
  color: #444; 
  font-family: 'Noto Sans TC', sans-serif; 
  font-size: 1.05rem; 
  font-weight: 400; 
  letter-spacing: 0.5px;
  line-height: 1.7; 
}

/* 7. 其他 */
.notice-box {
  margin-top: 50px; padding: 20px; background: #f9f9f9; border-radius: 8px;
  color: #666; font-size: 0.95rem; text-align: center; border-top: 3px solid #1A432D;
}

@media (max-width: 600px) {
  .card-header { flex-direction: column; }
  .date-side { width: 100%; padding: 15px; }
  .info-side { text-align: center; }
  .title-with-icon { justify-content: center; gap: 15px; }
}
</style>