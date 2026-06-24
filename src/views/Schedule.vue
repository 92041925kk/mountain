<template>
  <div class="schedule-page">
    
    <LoadingOverlay v-if="isLoading" text="載入行事曆中..." />

    <div v-if="errorMsg && !isLoading" class="error-banner">
      <p>⚠️ {{ errorMsg }}</p>
      <button class="btn-retry" @click="() => window.location.reload()">重新載入</button>
    </div>

    <template v-if="!isLoading && !errorMsg">
      <PageHeader
        :title="scheduleData.title || '學期行事曆'"
        subtitle="一步一腳印，開啟本學期的冒險旅程"
        :image="siteSettings.defaultPageHeaderImage"
      />

      <main class="container">
        <div class="schedule-list">
          
          <div v-if="!scheduleData.items || scheduleData.items.length === 0" class="no-data">
            <p>目前尚未發布任何行程。</p>
          </div>

          <div 
            v-for="(item, index) in scheduleData.items" 
            :key="index" 
            class="schedule-card"
            data-aos="fade-up"
            :data-aos-delay="index * 80"
          >
            <div class="card-header" @click="toggleDropdown(index)">
              <div class="date-side">
                <span class="date-text">{{ item.date }}</span>
              </div>
              
              <div class="info-side">
                <div class="title-with-icon">
                  <h3 :class="getTitleLengthClass(item.title)">{{ item.title }}</h3>

                  <div class="item-actions">
                    <!-- 倒隊（幹部手動切換）最優先 -->
                    <span v-if="getTripStatus(item) === 'cancelled'" class="signup-cancelled" @click.stop>
                      倒隊
                    </span>

                    <!-- 已出隊（行程日期已過） -->
                    <span v-else-if="getTripStatus(item) === 'done'" class="signup-done" @click.stop>
                      ⛰ 平安下山
                    </span>

                    <!-- 報名中：可點報名表單 -->
                    <a
                      v-else-if="getTripStatus(item) === 'signup-open'"
                      :href="item.signup_url.trim()"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="signup-link"
                      @click.stop
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" class="signup-icon" aria-hidden="true">
                        <path fill="currentColor" d="M9 2a1 1 0 0 0-1 1v1H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V3a1 1 0 0 0-1-1H9zm0 2h6v2H9V4zm-1 7h8v2H8v-2zm0 4h5v2H8v-2z"/>
                      </svg>
                      <span>報名表單</span>
                    </a>

                    <!-- 報名已截止 -->
                    <span
                      v-else-if="getTripStatus(item) === 'signup-closed'"
                      class="signup-closed"
                      @click.stop
                    >報名已截止</span>

                    <!-- 報名尚未開放 -->
                    <span v-else class="signup-pending" @click.stop>報名尚未開放</span>

                    <!-- FB 連結 -->
                    <a
                      v-if="isValidLink(item.facebook_url)"
                      :href="item.facebook_url.trim()"
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
              </div>

              <div class="toggle-arrow" :class="{ 'is-open': activeIndex === index }">
                ▼
              </div>
            </div>

            <div class="card-body" v-show="activeIndex === index">
              <div class="description-content">
                <p>{{ item.description || '目前還沒有隊伍簡介喔！請留意社課或社群公告。' }}</p>
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

defineOptions({ name: 'Schedule' });
import { db } from '../firebase';
import { isValidLink } from '../utils/links';
import { getTripStatus } from '../utils/scheduleDate';
import { withTimeout } from '../utils/withTimeout';
import LoadingOverlay from '../components/LoadingOverlay.vue';
import PageHeader from '../components/PageHeader.vue';
import { preloadImages } from '../utils/preloadImages';
import { defaultSiteSettings, getSiteSettings } from '../utils/siteSettings';

// --- 狀態控制 ---
const scheduleData = ref({ items: [] });
const isLoading = ref(true);
const errorMsg = ref('');
const activeIndex = ref(null); 
const siteSettings = ref({ ...defaultSiteSettings });

function getTitleLengthClass(title) {
  const length = Array.from(String(title || '')).length;
  return {
    'is-long-title': length >= 15,
    'is-extra-long-title': length >= 22,
  };
}

// --- 切換下拉功能 ---
const toggleDropdown = (index) => {
  activeIndex.value = activeIndex.value === index ? null : index;
};

// --- 初始化抓取資料 ---
onMounted(async () => {
  try {
    siteSettings.value = await getSiteSettings();
    const docRef = doc(db, "schedules", siteSettings.value.currentSemester);
    const docSnap = await withTimeout(getDoc(docRef));
    if (docSnap.exists()) {
      scheduleData.value = docSnap.data();
    }
    await preloadImages([siteSettings.value.defaultPageHeaderImage], { timeoutMs: 8000 });
  } catch (error) {
    console.error("Firebase 連線錯誤:", error);
    errorMsg.value = '載入失敗，請檢查網路連線後重新整理';
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

.info-side { padding: 25px 20px; display: flex; align-items: center; flex: 1; min-width: 0; }

.title-with-icon {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; min-height: 32px; min-width: 0;
}

.info-side h3 { margin: 0; color: #333; font-size: 1.3rem; min-width: 0; }

/* 5. 互動元素 */
.item-actions { display: flex; align-items: center; gap: 12px; flex: 0 0 auto; }

.fb-link { display: flex; align-items: center; transition: transform 0.2s; }
.fb-link:hover { transform: scale(1.15); }
.fb-icon { width: 26px; height: 26px; display: block; }

/* 報名表單按鈕 */
.signup-link {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 14px; border-radius: 999px;
  background: #1A432D; color: #fff;
  font-size: 0.85rem; font-weight: 600; white-space: nowrap;
  text-decoration: none; line-height: 1;
  box-shadow: 0 2px 6px rgba(26, 67, 45, 0.25);
  transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
}
.signup-link:hover {
  background: #245c3d; transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(26, 67, 45, 0.3);
}
.signup-icon { display: block; }

/* 報名尚未開放時的提示 */
.signup-pending {
  display: inline-flex; align-items: center;
  padding: 6px 14px; border-radius: 999px;
  background: #f1f1f1; color: #999;
  font-size: 0.8rem; font-weight: 500; white-space: nowrap;
  border: 1px dashed #d6d6d6; cursor: default; line-height: 1;
}

/* 報名已截止時的提示 */
.signup-closed {
  display: inline-flex; align-items: center;
  padding: 6px 14px; border-radius: 999px;
  background: #f7eceb; color: #b5524a;
  font-size: 0.8rem; font-weight: 600; white-space: nowrap;
  border: 1px solid #e8c9c5; cursor: default; line-height: 1;
}

/* 已出隊（平安下山）的徽章 */
.signup-done {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 6px 14px; border-radius: 999px;
  background: #eaf3ec; color: #1A432D;
  font-size: 0.8rem; font-weight: 700; white-space: nowrap;
  border: 1px solid #cfe5d6; cursor: default; line-height: 1;
}

/* 倒隊（取消出隊）的徽章 */
.signup-cancelled {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 6px 14px; border-radius: 999px;
  background: #ececec; color: #777;
  font-size: 0.8rem; font-weight: 700; white-space: nowrap;
  border: 1px solid #d6d6d6; cursor: default; line-height: 1;
  text-decoration: line-through; text-decoration-thickness: 1.5px;
}

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
  .info-side { width: 100%; padding: 24px 10px; text-align: center; }
  .title-with-icon { justify-content: center; gap: 8px; }
  .info-side h3 {
    flex: 0 1 auto;
    white-space: nowrap;
    font-size: 1rem;
    line-height: 1.35;
  }
  .info-side h3.is-long-title { font-size: 0.88rem; }
  /* 安全網：超長標題（≥22 字）改為允許換行，避免在窄螢幕超出卡片造成左右捲動 */
  .info-side h3.is-extra-long-title {
    font-size: 0.78rem;
    white-space: normal;
    overflow-wrap: anywhere;
  }
  .title-with-icon { flex-wrap: wrap; }
  .item-actions { gap: 10px; }
  .fb-link { flex: 0 0 auto; }
  .signup-link { padding: 5px 12px; font-size: 0.8rem; }
  .signup-pending,
  .signup-closed,
  .signup-done,
  .signup-cancelled { padding: 5px 12px; font-size: 0.75rem; }
}
</style>
