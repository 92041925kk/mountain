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
</script>

<style scoped>
/* 整體頁面底色與間距 */
.history-page {
  padding-bottom: 60px;
}

/* 頂部標題區塊 */
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
</style>