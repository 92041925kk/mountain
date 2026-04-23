<template>
  <div class="join-page">
      <header class="page-header">
        <h1>加入山社</h1>
        <p>成為我們的一份子，開啟你的高山旅程</p>
      </header>

      <main class="container">
        <section class="join-content">
          <h2>社辦地點</h2>
          
          <div class="info-card">
            <p><strong>📍 地點：</strong> 活動中心 304</p>
            <p><strong>💰 社費：</strong> 650 元（加入後終身是社員）</p>
          </div>

          <h2>追蹤我們</h2>
          <div class="social-links">
            <a href="https://www.instagram.com/cycumtclub/" target="_blank" rel="noopener noreferrer" class="social-btn ig">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              Instagram
            </a>
            <a href="https://www.facebook.com/groups/273866345627/" target="_blank" rel="noopener noreferrer" class="social-btn fb">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook 社團
            </a>
            <a href="https://line.me/ti/g/ISvx7KmvOg" target="_blank" rel="noopener noreferrer" class="social-btn line">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
              LINE 群組
            </a>
          </div>

          <div class="action-area">
            <p class="call-to-action">第一次接觸登山？先看看常見問題吧！</p>
            <router-link to="/faq" class="btn-primary">
              ❓ 常見問題 FAQ
            </router-link>
          </div>
        </section>
      </main>
  </div>
</template>

<script setup>
defineOptions({ name: 'Join' });
</script>

<style scoped>
/* 頁面底色與間距 */
.join-page {
  padding-bottom: 80px;
  background-color: #f0f5f1;
}

/* 頂部標題區塊 (與其他頁面保持一致風格) */
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

/* 社群連結 */
.social-links {
  display: flex;
  justify-content: center;
  gap: 14px;
  margin-bottom: 35px;
  flex-wrap: wrap;
}

.social-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 10px;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: bold;
  color: white;
  transition: transform 0.2s, box-shadow 0.2s;
}
.social-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.social-btn.ig {
  background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);
}
.social-btn.fb {
  background-color: #1877F2;
}
.social-btn.line {
  background-color: #06C755;
}

/* 社辦資訊卡 */
.info-card {
  background-color: #fdfdfd;
  border: 1px dashed #ccc;
  border-radius: 8px;
  padding: 20px;
  margin: 0 auto 35px;
  text-align: left;
  display: block;
  max-width: fit-content;
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
  .join-content {
    padding: 24px 18px;
    margin: 0 8px;
  }
  .info-card {
    padding: 14px;
    max-width: 100%;
  }
  .info-card p {
    font-size: 0.97rem;
  }
  .btn-primary {
    font-size: 1.05rem;
    padding: 13px 32px;
  }
  .social-links {
    flex-direction: column;
    align-items: center;
  }
  .social-btn {
    width: 200px;
    justify-content: center;
  }
  .join-page {
    padding-bottom: 50px;
  }
}
</style>