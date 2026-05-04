<template>
  <header class="admin-header">
    <div class="admin-header-inner">
      <div class="admin-nav">
        <router-link to="/cymc-admin/dashboard" class="back-link">← 後台首頁</router-link>
        <span class="divider-line">|</span>
        <span class="page-title">{{ title }}</span>
      </div>
      <div class="admin-user">
        <span class="user-email">{{ userEmail }}</span>
        <router-link to="/" class="btn-home">回到首頁</router-link>
        <button class="btn-logout" @click="handleLogout">登出</button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useRouter } from 'vue-router';

defineProps({ title: { type: String, required: true } });

const router = useRouter();
const userEmail = computed(() => auth.currentUser?.email || '');

async function handleLogout() {
  await signOut(auth);
  router.push('/cymc-admin');
}
</script>

<style scoped>
.admin-header {
  background-color: #1A432D;
  color: white;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 100;
}
.admin-header-inner {
  max-width: 1100px;
  margin: 0 auto;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.admin-nav {
  display: flex;
  align-items: center;
  gap: 12px;
}
.back-link {
  color: rgba(255,255,255,0.75);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s;
}
.back-link:hover { color: white; }
.divider-line { opacity: 0.4; }
.page-title {
  font-weight: bold;
  font-size: 1rem;
  letter-spacing: 0.5px;
}
.admin-user {
  display: flex;
  align-items: center;
  gap: 14px;
}
.user-email {
  font-size: 0.85rem;
  opacity: 0.8;
}
.btn-logout {
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.35);
  color: white;
  padding: 5px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.2s;
}
.btn-logout:hover { background: rgba(255,255,255,0.28); }
.btn-home {
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.35);
  color: white;
  padding: 5px 14px;
  border-radius: 6px;
  font-size: 0.85rem;
  text-decoration: none;
  transition: background 0.2s;
}
.btn-home:hover { background: rgba(255,255,255,0.28); }
</style>
