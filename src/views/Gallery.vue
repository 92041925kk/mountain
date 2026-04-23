<template>
  <div class="trips-overview-page">
    <header class="page-header">
      <h1>隊伍回顧</h1>
      <p>每一次登頂，都是最美的風景</p>
    </header>

    <main class="container">
      <div class="filter-section">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="搜尋隊伍名稱..." 
          class="search-input"
        />
        <div class="semester-filter">
          <label for="semester-select">選擇學期：</label>
          <select id="semester-select" v-model="selectedSemester">
            <option value="all">全部顯示</option>
            <option v-for="sem in availableSemesters" :key="sem" :value="sem">{{ sem }}</option>
          </select>
        </div>
      </div>
      
      <LoadingOverlay v-if="isLoading" text="探索山林中..." />

      <div v-else-if="errorMsg" class="error-banner">
        <p>⚠️ {{ errorMsg }}</p>
        <button class="btn-retry" @click="$router.go(0)">重新載入</button>
      </div>
        
      <div class="trip-grid" v-else> 
        <div v-if="filteredTrips.length === 0" class="no-results">
          <p>找不到符合條件的隊伍</p>
        </div>
        <router-link 
          v-for="(trip, idx) in filteredTrips" 
          :key="trip.id"
          :to="{ name: 'TripDetail', query: { id: trip.id } }" 
          class="trip-card"
          data-aos="fade-up"
          :data-aos-delay="(idx % 4) * 100"
        >
          <div class="card-img" :style="{ backgroundImage: `url(${trip.coverImage || defaultImg})` }"></div>
          
          <div class="card-content">
            <span class="tag">{{ trip.semester }}</span>
            <h3>{{ trip.title }}</h3>
            <p class="meta-info">天數：{{ trip.days }} | 難度：{{ trip.difficulty }}</p>
          </div>
        </router-link>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { collection, getDocs } from "firebase/firestore";
import { db } from '../firebase';
import LoadingOverlay from '../components/LoadingOverlay.vue';

defineOptions({ name: 'Gallery' });

// --- 狀態控制 ---
const trips = ref([]);
const isLoading = ref(true);
const errorMsg = ref('');
const selectedSemester = ref('all');
const searchQuery = ref('');
// 如果 Firebase 沒傳圖片，就用這張預設的山景圖
const defaultImg = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80';

// --- 取得所有學期選項 (動態生成且不重複) ---
const availableSemesters = computed(() => {
  const sems = trips.value.map(t => t.semester);
  return [...new Set(sems)].sort().reverse();
});

// --- 篩選後的隊伍列表 ---
const filteredTrips = computed(() => {
  let result = trips.value;
  if (selectedSemester.value !== 'all') {
    result = result.filter(t => t.semester === selectedSemester.value);
  }
  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    result = result.filter(t => t.title?.toLowerCase().includes(q));
  }
  return result;
});

// --- 🌟 生命週期：組件載入時去 Firebase 抓資料 ---
onMounted(async () => {
  try {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('連線逾時')), 8000)
    );
    const querySnapshot = await Promise.race([getDocs(collection(db, "trip")), timeout]);
    const tempTrips = [];
    
    querySnapshot.forEach((doc) => {
      tempTrips.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // 🌟 新增的排序魔法：把資料按照「學期」從新到舊 (遞減) 排序
    tempTrips.sort((a, b) => {
      // 比較兩者的 semester 字串 (例如 "113-1" 和 "112-2")
      // 如果 a 的學期大於 b，a 就排在前面 (-1)
      if (a.semester > b.semester) return -1;
      // 如果 a 的學期小於 b，b 就排在前面 (1)
      if (a.semester < b.semester) return 1;
      // 如果學期一樣，就保持原樣 (0)
      return 0; 
    });
    
    // 把排序好的陣列交給畫面的變數
    trips.value = tempTrips;
    
  } catch (error) {
    console.error("抓取列表失敗:", error);
    errorMsg.value = '載入失敗，請檢查網路連線後重新整理';
  } finally {
    // 稍等動畫跑一下再顯示畫面
    setTimeout(() => {
      isLoading.value = false;
    }, 500);
  }
});
</script>

<style scoped>
/* 整體頁面底色 */
.trips-overview-page {
  padding-bottom: 60px;
}
/* 🌟 限制主內容區塊的最大寬度，並讓它置中 */
.container {
  max-width: 1800px; /* 你可以根據喜好調整，通常 1200px ~ 1400px 最適合閱讀 */
  margin: 0 auto;    /* 讓整個區塊在畫面上水平置中 */
  padding: 0 40px;   /* 兩側加一點內邊距，確保螢幕縮小時也不會貼死邊緣 */
}
/* 頂部標題區塊 */
.page-header {
  background: linear-gradient(rgba(26, 67, 45, 0.8), rgba(26, 67, 45, 0.8)), url('https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=2070');
  background-size: cover;
  background-position: center;
  text-align: center;
  padding: 60px 20px;
  margin-bottom: 40px;
  color: white;
}

.page-header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  letter-spacing: 2px;
}

.page-header p {
  font-size: 1.1rem;
  opacity: 0.9;
}

/* 篩選器樣式 */
.filter-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 40px;
  flex-wrap: wrap;
}

.search-input {
  padding: 9px 16px;
  font-size: 1rem;
  border: 2px solid #1A432D;
  border-radius: 8px;
  width: 240px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.search-input:focus {
  border-color: #E2C044;
  box-shadow: 0 0 0 3px rgba(226, 192, 68, 0.25);
}
.search-input::placeholder {
  color: #aaa;
}

.semester-filter {
  font-size: 1.1rem;
  color: #333;
}

.filter-section select {
  padding: 8px 15px;
  font-size: 1rem;
  border: 2px solid #1A432D;
  border-radius: 6px;
  background-color: white;
  color: #1A432D;
  font-weight: bold;
  cursor: pointer;
}

.no-results {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 1.1rem;
}

/* 🌟 卡片網格排版 (固定四排與響應式) */
.trip-grid {
  display: grid;
  /* 大螢幕預設：強制分為 4 等分 (4個一排) */
  grid-template-columns: repeat(4, 1fr);
  gap: 30px;
}

/* 🌟 響應式設計 (RWD)：確保螢幕變小時不會破版 */

/* 當螢幕寬度小於 1200px (例如小筆電) 時 -> 變 3 個一排 */
@media (max-width: 1200px) {
  .trip-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 當螢幕寬度小於 900px (例如平板) 時 -> 變 2 個一排 */
@media (max-width: 900px) {
  .trip-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 當螢幕寬度小於 600px (例如手機) 時 -> 變 1 個一排 */
@media (max-width: 600px) {
  .trip-grid {
    grid-template-columns: repeat(1, 1fr);
  }
}

/* 單一卡片設計 */
.trip-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  text-decoration: none; /* 去除超連結底線 */
  color: #333;
  box-shadow: 0 4px 15px rgba(0,0,0,0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: block;
}

.trip-card:hover {
  transform: translateY(-8px); /* 滑鼠移上去時浮起 */
  box-shadow: 0 12px 20px rgba(0,0,0,0.15);
}

/* 卡片圖片區塊 */
.card-img {
  height: 200px;
  background-size: cover;
  background-position: center;
  background-color: #e9e9e9;
}

/* 卡片文字區塊 */
.card-content {
  padding: 20px;
}

/* 學期標籤 */
.tag {
  background-color: #1A432D;
  color: white;
  font-size: 0.85rem;
  padding: 4px 12px;
  border-radius: 20px;
  margin-bottom: 12px;
  display: inline-block;
  font-weight: bold;
  letter-spacing: 1px;
}

.card-content h3 {
  margin: 0 0 10px 0;
  color: #1A432D;
  font-size: 1.4rem;
}

.meta-info {
  color: #666;
  font-size: 0.95rem;
  margin: 0;
}
</style>