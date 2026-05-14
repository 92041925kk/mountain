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
</script>

<style scoped>
.page-content {
  flex: 1;
}
</style>
