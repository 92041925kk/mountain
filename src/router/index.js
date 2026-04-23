import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'Home', component: Home, meta: { title: '首頁' } },
    { path: '/history', name: 'History', component: () => import('../views/History.vue'), meta: { title: '山社歷史' } },
    { path: '/gallery', name: 'Gallery', component: () => import('../views/Gallery.vue'), meta: { title: '隊伍回顧' } },
    { path: '/schedule', name: 'Schedule', component: () => import('../views/Schedule.vue'), meta: { title: '學期行事曆' } },
    { path: '/join', name: 'Join', component: () => import('../views/Join.vue'), meta: { title: '加入山社' } },
    { path: '/faq', name: 'FAQ', component: () => import('../views/FAQ.vue'), meta: { title: '常見問題' } },
    // 注意這裡的 trip，我們還是保留原本的網址參數寫法，所以 path 是 /trip
    { path: '/trip', name: 'TripDetail', component: () => import('../views/TripDetail.vue'), meta: { title: '隊伍詳情' } },
    // 404 頁面 — 所有未匹配的路徑
    { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('../views/NotFound.vue'), meta: { title: '找不到頁面' } }
  ],
  // 換頁時自動回到最上面
  scrollBehavior() {
    return { top: 0 }
  }
})

const BASE_TITLE = '中原大學登山社'

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} - ${BASE_TITLE}` : BASE_TITLE
})

export default router