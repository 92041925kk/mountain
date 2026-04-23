import { createApp } from 'vue'
import './assets/main.css' // 確保有這行
import App from './App.vue'
import router from './router' // 引入路由
import AOS from 'aos'
import 'aos/dist/aos.css'

const app = createApp(App)
app.use(router) // 使用路由
app.mount('#app')

// 初始化 AOS 捲動動畫
AOS.init({
  duration: 700,
  easing: 'ease-out-cubic',
  once: true,       // 動畫只播放一次
  offset: 80,       // 元素距離視窗底部 80px 時觸發
})