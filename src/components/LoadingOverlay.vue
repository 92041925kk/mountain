<template>
  <div class="loading-overlay">
    <div class="loading-text">{{ text }} {{ Math.floor(progress) }}%</div>
    
    <div class="logo-mask-container">
      <div class="bg-layer"></div>
      
      <div class="color-layer" :style="{ width: progress + '%' }"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

defineProps({
  text: {
    type: String,
    default: '載入中...'
  }
});

const progress = ref(0);
let timer = null;

onMounted(() => {
  // 🌟 修正 2：拿掉隨機性！改成每 30 毫秒穩定增加 6%。
  // 這樣確保在 0.5 秒的過場時間內，一定會跑到 90% 以上，保證每次都看得到填滿效果！
  timer = setInterval(() => {
    if (progress.value < 95) {
      progress.value += 6; 
      if(progress.value > 95) progress.value = 95; // 卡在 95% 等待資料載入完成
    }
  }, 30);
});

onUnmounted(() => {
  clearInterval(timer);
});
</script>

<style scoped>
/* 基本置中排版 */
.loading-overlay {
  position: fixed; top: 70px; left: 0; width: 100%; height: calc(100% - 70px);
  background: #ffffff;
  display: flex; flex-direction: column;
  justify-content: center; align-items: center; 
  z-index: 999;
}

/* 呼吸燈動畫 */
@keyframes pulse {
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 0.8; }
}
.loading-text { 
  font-family: sans-serif; 
  color: #1A432D; 
  font-weight: bold; 
  font-size: 1.2rem;
  letter-spacing: 2px; 
  animation: pulse 1.5s infinite ease-in-out; 
}

/* 遮罩容器 */
.logo-mask-container {
  position: relative;
  width: 280px; 
  height: 120px;
  margin-top: 30px;
  overflow: hidden; 

  /* ⚠️ 記得確認這張圖片的路徑是正確的喔 */
  -webkit-mask-image: url('../assets/cymc-logo.png');
  mask-image: url('../assets/cymc-logo.png');
  -webkit-mask-size: contain;
  mask-size: contain;
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
}

/* 灰色底層 */
.bg-layer {
  position: absolute;
  top: 0; left: 0;
  width: 100%; 
  height: 100%;
  background-color: #e0e0e0;
}

/* 彩色填充層 */
.color-layer {
  position: absolute;
  top: 0; left: 0;
  height: 100%;
  
  background: linear-gradient(90deg, #1A432D, #E2C044);
  background-size: 280px 100%; 
  
  /* 把過渡動畫調快，配合我們穩定的 JS 增長 */
  transition: width 0.1s linear; 
}
</style>