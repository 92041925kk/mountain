<template>
  <div class="admin-dashboard">
    <AdminHeader title="後台首頁" />

    <main class="admin-main">
      <h2>歡迎回來</h2>
      <p class="admin-hint">選擇要管理的項目</p>

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
import AdminHeader from '../../components/admin/AdminHeader.vue';
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
  margin-bottom: 36px;
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
}

@media (min-width: 701px) and (max-width: 980px) {
  .admin-cards { grid-template-columns: repeat(2, 1fr); }
}
</style>
