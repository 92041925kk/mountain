<template>
  <div class="home-page">
    
    <LoadingOverlay v-if="isLoading" text="正在探索山林..." />

    <template v-if="!isLoading">
      <header class="hero">
        <div class="hero-content">
          <h1>來都來了，來爬山吧</h1>
          <p>一步一腳印，看見台灣之美</p>
          <router-link to="/join" class="btn-primary">立即加入</router-link>
        </div>
      </header>

      <main class="container">
        <section class="intro-section">
          <h2>歡迎來到中原大學登山社</h2>
          <div class="divider"></div>
          <p class="intro-text">
            我們是一群熱愛山林、挑戰自我的夥伴。在這裡，你可以找到志同道合的朋友，一起探索台灣的百岳與秘境。
          </p>
        </section>
      </main>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
// 🌟 確保路徑指向你存放 LoadingOverlay.vue 的地方
import LoadingOverlay from '../components/LoadingOverlay.vue';

const isLoading = ref(true);

onMounted(() => {
  // 模擬首頁加載，通常首頁會放比較大的圖，稍微留點載入時間體驗更好
  setTimeout(() => {
    isLoading.value = false;
  }, 700);
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
}
</style>