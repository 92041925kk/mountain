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
import { ref, onMounted } from 'vue';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import LoadingOverlay from '../components/LoadingOverlay.vue';

defineOptions({ name: 'Home' });

const isLoading = ref(true);
const errorMsg = ref('');
const upcomingTrips = ref([]);

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
</style>