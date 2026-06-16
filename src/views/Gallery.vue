<template>
  <div class="trips-overview-page">
    <PageHeader title="隊伍回顧" subtitle="每一次登頂，都是最美的風景" />

    <main class="container">
      <div class="filter-section">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="搜尋隊伍名稱..." 
          class="search-input"
        />
        <input
          v-model="daysQuery"
          type="text"
          placeholder="搜尋天數，例如：單日、3天、三天兩夜"
          class="search-input days-input"
        />
        <div class="semester-filter">
          <label for="semester-select">選擇學期：</label>
          <select id="semester-select" v-model="selectedSemester">
            <option value="all">全部顯示</option>
            <option v-for="sem in availableSemesters" :key="sem" :value="sem">{{ sem }}</option>
          </select>
        </div>
        <div class="semester-filter">
          <label for="type-select">選擇類型：</label>
          <select id="type-select" v-model="selectedType">
            <option value="all">全部類型</option>
            <option v-for="type in availableTypes" :key="type" :value="type">{{ type }}</option>
          </select>
        </div>
        <div class="semester-filter">
          <label for="region-select">選擇地區：</label>
          <select id="region-select" v-model="selectedRegion">
            <option value="all">全部地區</option>
            <option v-for="region in availableRegions" :key="region" :value="region">{{ region }}</option>
          </select>
        </div>
      </div>
      
      <LoadingOverlay v-if="isLoading" text="探索山林中..." />

      <div v-else-if="errorMsg" class="error-banner">
        <p>⚠️ {{ errorMsg }}</p>
        <button class="btn-retry" @click="() => window.location.reload()">重新載入</button>
      </div>
        
      <div class="album-list" v-else>
        <div v-if="filteredTrips.length === 0" class="no-results">
          <p>找不到符合條件的隊伍</p>
        </div>
        <section v-for="group in groupedTrips" :key="group.semester" class="album-section">
          <div class="album-heading">
            <div>
              <span>Album</span>
              <h2>{{ group.semester }} 隊伍回顧</h2>
            </div>
            <p>{{ group.trips.length }} 筆紀錄</p>
          </div>
          <div class="trip-grid">
            <NuxtLink
              v-for="(trip, idx) in group.trips"
              :key="trip.id"
              :to="{ path: '/trip', query: { id: trip.id } }"
              class="trip-card"
              data-aos="fade-up"
              :data-aos-delay="(idx % 4) * 100"
            >
              <div class="card-img" :style="{ backgroundImage: `url(${trip.coverImage || defaultImg})` }"></div>

              <div class="card-content">
                <span class="tag">{{ trip.difficulty || '山社隊伍' }}</span>
                <h3>{{ trip.title }}</h3>
                <p class="meta-info">
                  天數：{{ trip.days || '未標註' }} | 地區：{{ getTripRegion(trip) || '未標註' }} | 學期：{{ trip.semester }}
                </p>
              </div>
            </NuxtLink>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from '../firebase';
import LoadingOverlay from '../components/LoadingOverlay.vue';
import PageHeader from '../components/PageHeader.vue';
import { preloadImages } from '../utils/preloadImages';
import { withTimeout } from '../utils/withTimeout';
import { useDebounce } from '../composables/useDebounce';

defineOptions({ name: 'Gallery' });

// --- 狀態控制 ---
const trips = ref([]);
const isLoading = ref(true);
const errorMsg = ref('');
const selectedSemester = ref('all');
const selectedType = ref('all');
const selectedRegion = ref('all');
const searchQuery = ref('');
const daysQuery = ref('');
const debouncedSearch = useDebounce(searchQuery);
const debouncedDaysQuery = useDebounce(daysQuery);
// 如果 Firebase 沒傳圖片，就用這張預設的山景圖
const defaultImg = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80';
const REGION_OPTIONS = ['北部', '中部', '南部', '東部', '離島', '海外', '其他'];
const REGION_KEYWORDS = {
  北部: ['北部', '台北', '臺北', '新北', '基隆', '桃園', '新竹', '宜蘭', '陽明山', '大屯', '雪山', '雪主', '雪北', '雪東', '北插', '塔曼', '李棟山', '霞喀羅'],
  中部: ['中部', '苗栗', '台中', '臺中', '彰化', '南投', '合歡', '奇萊', '白姑', '武陵', '能高', '干卓萬', '丹大', '郡大', '奧萬大', '鳶嘴', '稍來'],
  南部: ['南部', '雲林', '嘉義', '台南', '臺南', '高雄', '屏東', '玉山', '阿里山', '關山', '北大武', '南橫', '尾寮山', '小琉球'],
  東部: ['東部', '花蓮', '台東', '臺東', '太魯閣', '秀姑巒', '馬博', '八通關', '向陽', '嘉明湖', '蘭嶼', '綠島'],
  離島: ['離島', '澎湖', '金門', '馬祖', '蘭嶼', '綠島', '小琉球'],
  海外: ['海外', '日本', '韓國', '尼泊爾', '海外遠征'],
};

// --- 取得所有學期選項 (動態生成且不重複) ---
const availableSemesters = computed(() => {
  const sems = trips.value.map(t => t.semester);
  return [...new Set(sems)].sort().reverse();
});

const availableTypes = computed(() => {
  const types = trips.value.map(t => t.difficulty).filter(Boolean);
  return [...new Set(types)].sort();
});

const availableRegions = computed(() => {
  const regions = trips.value.map(getTripRegion).filter(Boolean);
  const uniqueRegions = [...new Set(regions)];
  return REGION_OPTIONS.filter(region => uniqueRegions.includes(region));
});

// --- 篩選後的隊伍列表 ---
const filteredTrips = computed(() => {
  let result = trips.value;
  if (selectedSemester.value !== 'all') {
    result = result.filter(t => t.semester === selectedSemester.value);
  }
  if (selectedType.value !== 'all') {
    result = result.filter(t => t.difficulty === selectedType.value);
  }
  if (selectedRegion.value !== 'all') {
    result = result.filter(t => getTripRegion(t) === selectedRegion.value);
  }
  const q = debouncedSearch.value.trim().toLowerCase();
  if (q) {
    result = result.filter(t => t.title?.toLowerCase().includes(q));
  }
  const daysText = normalizeSearchText(debouncedDaysQuery.value);
  if (daysText) {
    const targetDays = parseDayCount(daysText);
    result = result.filter((trip) => {
      const tripDays = normalizeSearchText(trip.days);
      if (!tripDays) return false;
      if (tripDays.includes(daysText)) return true;

      const tripDayCount = parseDayCount(tripDays);
      return targetDays !== null && tripDayCount !== null && targetDays === tripDayCount;
    });
  }
  return result;
});

const groupedTrips = computed(() => {
  const groups = new Map();
  filteredTrips.value.forEach((trip) => {
    const semester = trip.semester || '未標註學期';
    if (!groups.has(semester)) groups.set(semester, []);
    groups.get(semester).push(trip);
  });
  return [...groups.entries()].map(([semester, groupTrips]) => ({ semester, trips: groupTrips }));
});

function compareTripsBySemester(a, b) {
  return String(b.semester || '').localeCompare(String(a.semester || ''), 'zh-TW', {
    numeric: true,
    sensitivity: 'base',
  });
}

function isPublicTrip(trip) {
  // Legacy trip records predate the status field and were public before drafts existed.
  return trip.status !== 'draft';
}

function getTripRegion(trip) {
  const explicitRegion = String(trip.locationRegion || trip.region || trip.area || '').trim();
  if (REGION_OPTIONS.includes(explicitRegion)) return explicitRegion;

  const searchableText = [
    trip.title,
    trip.summary,
    trip.difficulty,
    ...(Array.isArray(trip.plan)
      ? trip.plan.flatMap(day => (day.items || []).map(item => `${item.location || ''} ${item.info || ''}`))
      : []),
  ].join(' ');

  return inferRegion(searchableText);
}

function inferRegion(text) {
  const source = String(text || '').toLowerCase();
  return REGION_OPTIONS.find(region =>
    REGION_KEYWORDS[region]?.some(keyword => source.includes(keyword.toLowerCase()))
  ) || '';
}

function normalizeSearchText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

function parseDayCount(value) {
  const text = normalizeSearchText(value);
  if (!text) return null;
  if (/(單日|一日|1日|1天)/.test(text)) return 1;

  const digitMatch = text.match(/(\d+)\s*(天|日)/);
  if (digitMatch) return Number(digitMatch[1]);

  const chineseDigits = {
    一: 1,
    二: 2,
    兩: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
    十: 10,
  };
  const chineseMatch = text.match(/([一二兩三四五六七八九十])天/);
  return chineseMatch ? chineseDigits[chineseMatch[1]] : null;
}

async function loadPublicTrips() {
  try {
    return await getDocs(collection(db, "trip"));
  } catch (error) {
    if (error.code !== 'permission-denied') throw error;

    return getDocs(query(
      collection(db, "trip"),
      where("status", "==", "published")
    ));
  }
}

// --- 🌟 生命週期：組件載入時去 Firebase 抓資料 ---
onMounted(async () => {
  try {
    const querySnapshot = await withTimeout(loadPublicTrips());
    
    trips.value = querySnapshot.docs
      .map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }))
      .filter(isPublicTrip)
      .sort(compareTripsBySemester);

    await preloadImages(
      trips.value.slice(0, 12).map(trip => trip.coverImage || defaultImg),
      { timeoutMs: 8000 }
    );
    
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
.album-list {
  display: flex;
  flex-direction: column;
  gap: 42px;
}
.days-input {
  width: 300px;
}

.album-section {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.album-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  border-bottom: 1px solid #e2e9df;
  padding-bottom: 14px;
}

.album-heading span {
  color: #a67b25;
  font-size: 0.8rem;
  font-weight: 800;
}

.album-heading h2 {
  color: #1A432D;
  margin: 4px 0 0;
  font-size: 1.5rem;
}

.album-heading p {
  margin: 0;
  color: #78847d;
  font-size: 0.9rem;
}

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
  .search-input,
  .days-input {
    width: 100%;
  }
  .trip-grid {
    grid-template-columns: repeat(1, 1fr);
  }
  .album-heading {
    align-items: flex-start;
    flex-direction: column;
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
