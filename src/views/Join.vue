<template>
  <div class="join-page">
      <header class="page-header">
        <h1>加入山社</h1>
        <p>成為我們的一份子，開啟你的高山旅程</p>
      </header>

      <main class="container">
        <section class="join-content">
          <h2>社課時間與地點</h2>
          
          <div class="info-card">
            <p><strong>🕒 時間：</strong> 每週三晚上 19:00 - 21:00</p>
            <p><strong>📍 地點：</strong> 活動中心 3 樓 (詳細教室依當週粉專公告為準)</p>
          </div>

          <div class="action-area">
            <p class="call-to-action">準備好和我們一起出發了嗎？</p>
            <a href="#" target="_blank" rel="noopener noreferrer" class="btn-primary">
              填寫線上入社表單
            </a>
          </div>
        </section>
      </main>
  </div>
</template>

<script setup>
</script>

<style scoped>
/* 頁面底色與間距 */
.join-page {
  padding-bottom: 80px;
}

/* 頂部標題區塊 (與其他頁面保持一致風格) */
.page-header {
  text-align: center;
  padding: 50px 20px;
  background-color: #f4f8f5;
  margin-bottom: 40px;
  border-bottom: 1px solid #eaeaea;
}

.page-header h1 {
  color: #1A432D;
  font-size: 2.2rem;
  margin-bottom: 10px;
}

.page-header p {
  color: #666;
  font-size: 1.1rem;
}

/* 主要內容卡片 */
.join-content {
  max-width: 600px; /* 限制寬度讓畫面更集中、更好看 */
  margin: 0 auto;
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  text-align: center; /* 內容置中 */
}

.join-content h2 {
  color: #1A432D;
  margin-top: 0;
  border-bottom: 3px solid #E2C044;
  display: inline-block;
  padding-bottom: 8px;
  margin-bottom: 25px;
}

/* 時間地點資訊卡 */
.info-card {
  background-color: #fdfdfd;
  border: 1px dashed #ccc;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 35px;
  text-align: left; /* 資訊內容靠左對齊比較好閱讀 */
  display: inline-block;
}

.info-card p {
  margin: 10px 0;
  color: #444;
  font-size: 1.1rem;
}

/* 報名行動區塊 */
.action-area {
  margin-top: 20px;
}

.call-to-action {
  font-size: 1.15rem;
  color: #555;
  margin-bottom: 20px;
  font-weight: bold;
}

/* 🌟 超有質感的報名按鈕 */
.btn-primary {
  display: inline-block;
  background-color: #1A432D;
  color: white;
  text-decoration: none;
  font-size: 1.2rem;
  font-weight: bold;
  padding: 15px 40px;
  border-radius: 30px; /* 圓角按鈕 */
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(26, 67, 45, 0.3); /* 綠色淡淡陰影 */
}

.btn-primary:hover {
  background-color: #123020; /* 移上去變深色 */
  transform: translateY(-3px); /* 輕微上浮 */
  box-shadow: 0 6px 15px rgba(26, 67, 45, 0.4);
  color: #E2C044; /* 文字變成金黃色點綴 */
}
</style>