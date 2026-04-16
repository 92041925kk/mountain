import { createApp } from 'vue'
import './assets/main.css' // 確保有這行
import App from './App.vue'
import router from './router' // 引入路由

const app = createApp(App)
app.use(router) // 使用路由
app.mount('#app')