<template>
  <div class="admin-dashboard">
    <AdminHeader title="後台首頁" />

    <main class="admin-main">
      <div class="dash-top">
        <div>
          <h2>歡迎回來</h2>
          <p class="admin-hint">選擇要管理的項目</p>
        </div>
        <a href="/" target="_blank" rel="noopener" class="btn-preview">🔗 開啟前台預覽</a>
      </div>

      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-label">目前學期</span>
          <strong class="stat-value">{{ isLoadingStats ? '—' : (stats.currentSemester || '未設定') }}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">本學期行程數</span>
          <strong class="stat-value">{{ isLoadingStats ? '—' : stats.scheduleCount }}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">已發布行程紀錄</span>
          <strong class="stat-value">{{ isLoadingStats ? '—' : stats.publishedTrips }}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">照片總數</span>
          <strong class="stat-value">{{ isLoadingStats ? '—' : stats.photoCount }}</strong>
        </div>
      </div>

      <div class="admin-cards">
        <div class="admin-card">
          <div class="card-icon">🗓️</div>
          <h3>行事曆管理</h3>
          <p>新增、編輯、刪除本學期出隊行程</p>
          <NuxtLink to="/cymc-admin/schedule" class="btn-card">進入管理</NuxtLink>
        </div>
        <div class="admin-card">
          <div class="card-icon">🖼️</div>
          <h3>照片管理</h3>
          <p>上傳新照片或刪除照片牆圖片</p>
          <NuxtLink to="/cymc-admin/photos" class="btn-card">進入管理</NuxtLink>
        </div>
        <div class="admin-card">
          <div class="card-icon">🥾</div>
          <h3>行程紀錄管理</h3>
          <p>新增或編輯各次出隊的詳細時間線</p>
          <NuxtLink to="/cymc-admin/trips" class="btn-card">進入管理</NuxtLink>
        </div>
        <div class="admin-card">
          <div class="card-icon">⚙️</div>
          <h3>網站設定</h3>
          <p>調整目前學期、首頁封面與網站分享摘要</p>
          <NuxtLink to="/cymc-admin/settings" class="btn-card">進入管理</NuxtLink>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { collection, doc, getCountFromServer, getDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import AdminHeader from '../../components/admin/AdminHeader.vue';
import { getSiteSettings } from '../../utils/siteSettings';

const isLoadingStats = ref(true);
const stats = ref({
  currentSemester: '',
  scheduleCount: 0,
  publishedTrips: 0,
  photoCount: 0,
});

async function countDocs(ref) {
  const snap = await getCountFromServer(ref);
  return snap.data().count;
}

onMounted(async () => {
  try {
    const settings = await getSiteSettings();
    stats.value.currentSemester = settings.currentSemester || '';

    const [publishedTrips, photoCount, scheduleSnap] = await Promise.all([
      countDocs(query(collection(db, 'trip'), where('status', '==', 'published'))),
      countDocs(collection(db, 'photos')),
      settings.currentSemester
        ? getDoc(doc(db, 'schedules', settings.currentSemester))
        : Promise.resolve(null),
    ]);

    stats.value.publishedTrips = publishedTrips;
    stats.value.photoCount = photoCount;
    stats.value.scheduleCount = scheduleSnap?.exists() ? (scheduleSnap.data().items?.length || 0) : 0;
  } catch (e) {
    console.warn('後台統計載入失敗:', e);
  } finally {
    isLoadingStats.value = false;
  }
});
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background-color: #f5f7f5;
}

.admin-main {
  max-width: 1000px;
  margin: 0 auto;
  padding: 48px 24px;
}

.admin-main h2 {
  color: #1A432D;
  font-size: 1.8rem;
  margin-bottom: 6px;
}

.admin-hint {
  color: #888;
}

.dash-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 28px;
}

.btn-preview {
  flex-shrink: 0;
  display: inline-block;
  background: white;
  color: #1A432D;
  border: 2px solid #1A432D;
  text-decoration: none;
  padding: 9px 18px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: bold;
  transition: background-color 0.2s, color 0.2s;
}

.btn-preview:hover {
  background: #1A432D;
  color: white;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 36px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 18px 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
  border-left: 4px solid #E2C044;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-label {
  color: #888;
  font-size: 0.82rem;
}

.stat-value {
  color: #1A432D;
  font-size: 1.6rem;
  font-weight: 800;
  line-height: 1.1;
}

.admin-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }

.admin-card {
  background: white;
  border-radius: 14px;
  padding: 28px 24px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.07);
  text-align: center;
}

.card-icon {
  font-size: 2.2rem;
  margin-bottom: 12px;
}

.admin-card h3 {
  color: #1A432D;
  font-size: 1.1rem;
  margin-bottom: 8px;
}

.admin-card p {
  color: #666;
  font-size: 0.88rem;
  line-height: 1.6;
  margin-bottom: 20px;
}

.btn-card {
  display: inline-block;
  background-color: #1A432D;
  color: white;
  text-decoration: none;
  padding: 9px 22px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: bold;
  transition: background-color 0.2s;
}

.btn-card:hover {
  background-color: #245c3d;
}

@media (max-width: 700px) {
  .admin-cards { grid-template-columns: 1fr; }
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .dash-top { flex-direction: column; }
}

@media (min-width: 701px) and (max-width: 980px) {
  .admin-cards { grid-template-columns: repeat(2, 1fr); }
  .stats-row { grid-template-columns: repeat(2, 1fr); }
}
</style>
