import { createRouter, createWebHistory } from 'vue-router'
import { onAuthStateChanged } from 'firebase/auth'
import Home from '../views/Home.vue'
import { auth } from '../firebase'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'Home', component: Home, meta: { title: '首頁', description: '中原大學登山社官方網站，收錄社史、學期隊伍、行程回顧、照片與入社資訊。' } },
    { path: '/history', name: 'History', component: () => import('../views/History.vue'), meta: { title: '山社歷史', description: '從綠野登山社到中原大學登山社，回顧五十多年來的社史與傳承。' } },
    { path: '/gallery', name: 'Gallery', component: () => import('../views/Gallery.vue'), meta: { title: '隊伍回顧', description: '瀏覽中原登山社各學期隊伍回顧與行程紀錄。' } },
    { path: '/schedule', name: 'Schedule', component: () => import('../views/Schedule.vue'), meta: { title: '學期行事曆', description: '查看中原登山社本學期出隊行程與活動公告。' } },
    { path: '/join', name: 'Join', component: () => import('../views/Join.vue'), meta: { title: '加入山社', description: '了解中原大學登山社入社方式、社辦位置與社群連結。' } },
    { path: '/faq', name: 'FAQ', component: () => import('../views/FAQ.vue'), meta: { title: '常見問題', description: '第一次加入登山社前，先看看裝備、體能、安全與報名方式。' } },
    { path: '/trip', name: 'TripDetail', component: () => import('../views/TripDetail.vue'), meta: { title: '隊伍詳情', description: '查看中原登山社隊伍的行程紀錄、路線資訊與照片。' } },

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
    {
      path: '/cymc-admin/settings',
      name: 'AdminSettings',
      component: () => import('../views/admin/AdminSettings.vue'),
      meta: { title: '網站設定', isAdmin: true, requiresAuth: true }
    },

    // 404 頁面
    { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('../views/NotFound.vue'), meta: { title: '找不到頁面' } }
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})

const BASE_TITLE = '中原大學登山社'
const BASE_DESCRIPTION = '中原大學登山社官方網站，收錄社史、學期隊伍、行程回顧、照片與入社資訊。'

function setMetaTag(selector, attrName, attrValue, content) {
  let tag = document.head.querySelector(selector)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attrName, attrValue)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

router.afterEach((to) => {
  const title = to.meta.title ? `${to.meta.title} - ${BASE_TITLE}` : BASE_TITLE
  const description = to.meta.description || BASE_DESCRIPTION
  document.title = title
  setMetaTag('meta[name="description"]', 'name', 'description', description)
  setMetaTag('meta[property="og:title"]', 'property', 'og:title', title)
  setMetaTag('meta[property="og:description"]', 'property', 'og:description', description)
  setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', title)
  setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description)
})

let authInitialized = false
let authReadyPromise = null

function waitForAuthReady() {
  if (authInitialized) return Promise.resolve(auth.currentUser)

  if (!authReadyPromise) {
    authReadyPromise = new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          authInitialized = true
          unsubscribe()
          resolve(user)
        },
        reject
      )
    })
  }

  return authReadyPromise
}

// 後台路由守衛：等待 Firebase 還原登入狀態後，再判斷是否能進入後台頁面
router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true

  const user = await waitForAuthReady()
  if (user) return true

  return {
    path: '/cymc-admin',
    query: { redirect: to.fullPath },
  }
})

export default router
