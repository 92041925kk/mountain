<template>
  <div class="not-found-page">
    <div class="not-found-content">
      <h1>404</h1>
      <p>找不到這個頁面，可能已經被雲霧遮蔽了</p>
      <router-link to="/" class="btn-back">回到首頁</router-link>
    </div>
  </div>
</template>

<style scoped>
.not-found-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 140px);
  text-align: center;
  padding: 40px 20px;
}
.not-found-content h1 {
  font-size: 6rem;
  font-weight: bold;
  color: #1A432D;
  margin-bottom: 12px;
  line-height: 1;
}
.not-found-content p {
  font-size: 1.15rem;
  color: #666;
  margin-bottom: 28px;
}
.btn-back {
  display: inline-block;
  background-color: #1A432D;
  color: white;
  text-decoration: none;
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 1rem;
  transition: background-color 0.2s;
}
.btn-back:hover {
  background-color: #123020;
}
</style>
