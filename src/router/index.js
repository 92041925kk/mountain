import { createRouter, createWebHistory } from 'vue-router'
import { getAuth } from 'firebase/auth'
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
    { path: '/trip', name: 'TripDetail', component: () => import('../views/TripDetail.vue'), meta: { title: '隊伍詳情' } },

    // ── 隱藏後台入口（不出現在 Navbar）──
    {
      path: '/cymc-admin',
      name: 'AdminLogin',
      component: () => import('../views/admin/AdminLogin.vue'),
      meta: { title: '後台登入', isAdmin: true }
    },
    {
      path: '/cymc-admin/dashboard',
      name: 'AdminDashboard',
      component: () => import('../views/admin/AdminDashboard.vue'),
      meta: { title: '後台管理', isAdmin: true, requiresAuth: true }
    },
    {
      path: '/cymc-admin/photos',
      name: 'AdminPhotos',
      component: () => import('../views/admin/AdminPhotos.vue'),
      meta: { title: '照片管理', isAdmin: true, requiresAuth: true }
    },
    {
      path: '/cymc-admin/schedule',
      name: 'AdminSchedule',
      component: () => import('../views/admin/AdminSchedule.vue'),
      meta: { title: '行事曆管理', isAdmin: true, requiresAuth: true }
    },
    {
      path: '/cymc-admin/trips',
      name: 'AdminTrips',
      component: () => import('../views/admin/AdminTrips.vue'),
      meta: { title: '行程紀錄管理', isAdmin: true, requiresAuth: true }
    },

    // 404 頁面
    { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('../views/NotFound.vue'), meta: { title: '找不到頁面' } }
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})

const BASE_TITLE = '中原大學登山社'

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} - ${BASE_TITLE}` : BASE_TITLE
})

// 後台路由守衛：requiresAuth 的頁面需登入
router.beforeEach((to, _from, next) => {
  if (!to.meta.requiresAuth) return next();
  const auth = getAuth();
  if (auth.currentUser) {
    next();
  } else {
    next('/cymc-admin');
  }
})

export default router