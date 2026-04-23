<template>
  <div class="history-page">
      <header class="page-header">
        <h1>山社歷史</h1>
        <p>那些年，我們一起爬過的山</p>
      </header>

      <main class="container">
        <section class="history-content">
          <h2>創社源起</h2>
          <p>這裡可以填寫中原登山社創立的故事、初衷，以及歷屆學長姐傳承下來的精神...</p>
        </section>
      </main>
  </div>
</template>

<script setup>
defineOptions({ name: 'History' });
</script>

<style scoped>
/* 整體頁面底色與間距 */
.history-page {
  padding-bottom: 60px;
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

/* 內容區塊的卡片設計 */
.history-content {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  line-height: 1.8;
  color: #444;
  font-size: 1.05rem;
}

/* 小標題設計，加上登山社的金黃色底線點綴 */
.history-content h2 {
  color: #1A432D;
  margin-top: 0;
  border-bottom: 3px solid #E2C044;
  display: inline-block;
  padding-bottom: 8px;
  margin-bottom: 20px;
}

@media (max-width: 600px) {
  .page-header {
    padding: 35px 16px;
    margin-bottom: 24px;
  }
  .page-header h1 {
    font-size: 1.6rem;
  }
  .page-header p {
    font-size: 0.95rem;
  }
  .history-content {
    padding: 24px 18px;
    font-size: 0.97rem;
  }
  .history-page {
    padding-bottom: 40px;
  }
}
</style>