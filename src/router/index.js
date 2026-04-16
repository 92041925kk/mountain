import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'Home', component: Home },
    { path: '/history', name: 'History', component: () => import('../views/History.vue') },
    { path: '/gallery', name: 'Gallery', component: () => import('../views/Gallery.vue') },
    { path: '/schedule', name: 'Schedule', component: () => import('../views/Schedule.vue') },
    { path: '/join', name: 'Join', component: () => import('../views/Join.vue') },
    // 注意這裡的 trip，我們還是保留原本的網址參數寫法，所以 path 是 /trip
    { path: '/trip', name: 'TripDetail', component: () => import('../views/TripDetail.vue') }
  ],
  // 換頁時自動回到最上面
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router