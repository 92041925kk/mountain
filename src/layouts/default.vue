<template>
  <Navbar v-if="!isAdminRoute" />
  <div class="page-content">
    <slot />
  </div>
  <Footer v-if="!isAdminRoute" />
</template>

<script setup>
import { computed } from 'vue'

const route = useRoute()
const isAdminRoute = computed(() => route.meta.isAdmin === true || route.path.startsWith('/cymc-admin'))

// 後台頁面沒有固定導覽列，移除 body 為導覽列預留的頂部空白
useHead({
  bodyAttrs: {
    class: computed(() => (isAdminRoute.value ? 'admin-mode' : '')),
  },
})
</script>

<style scoped>
.page-content {
  flex: 1;
}
</style>
