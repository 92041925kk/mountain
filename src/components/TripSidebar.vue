<template>
  <aside class="trip-sidebar">
    <div class="info-box">
      <h3>路線資訊</h3>
      <ul>
        <li><strong>難度分級：</strong> <span>{{ trip.difficulty || '未標註' }}</span></li>
        <li><strong>總里程：</strong> <span>{{ trip.distance || '未提供' }}</span></li>
      </ul>
      
      <div class="gpx-map-container" v-if="trip.mapUrl">
        <iframe 
          :src="trip.mapUrl" 
          width="100%" 
          height="250" 
          style="border:0;" 
          allowfullscreen="" 
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade">
        </iframe>
      </div>

      <hr class="sidebar-divider">
      
      <h3>相關檔案</h3>
      <a v-if="trip.pdfUrl" :href="trip.pdfUrl" target="_blank" class="btn-download">
        📄 下載行程紀錄 (PDF)
      </a>
      
      <p v-if="!trip.pdfUrl" style="color: #999; font-size: 0.9rem;">
        目前尚未上傳相關檔案
      </p>
    </div>
  </aside>
</template>

<script setup>
defineProps({
  trip: {
    type: Object,
    required: true,
    default: () => ({})
  }
});
</script>

<style scoped>
/* 側邊欄基礎佈局 */
.trip-sidebar { flex: 1; position: sticky; top: 100px; align-self: flex-start; }
.info-box { background: #fdfdfd; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border-top: 5px solid #1A432D; }
.sidebar-divider { margin: 20px 0; border: none; border-top: 1px solid #eee; }

/* 地圖樣式 */
.gpx-map-container {
  margin-top: 20px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #eaeaea;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

/* 下載按鈕基礎樣式 */
.btn-download { 
  display: block; text-decoration: none; background: white; 
  color: #1A432D; border: 1px solid #1A432D; padding: 10px; 
  text-align: center; border-radius: 6px; transition: 0.3s; 
  margin-bottom: 12px; 
}
.btn-download:hover { background: #1A432D; color: white; }

/* 響應式：手機版取消 sticky，讓它自然往下排 */
@media (max-width: 900px) {
  .trip-sidebar { position: static; }
}
</style>