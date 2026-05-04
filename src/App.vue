<template>
  <div id="app">
    <Navbar v-if="!isAdminRoute" />
    <div class="page-content">
      <router-view v-slot="{ Component }">
        <Transition name="page-fade" mode="out-in">
          <KeepAlive :include="['History', 'Join', 'FAQ']">
            <component :is="Component" />
          </KeepAlive>
        </Transition>
      </router-view>
    </div>
    <Footer v-if="!isAdminRoute" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'

const route = useRoute()
const isAdminRoute = computed(() => route.meta.isAdmin === true)
</script>

<style>
#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.page-content {
  flex: 1;
}

.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.25s ease;
}

.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}
</style>
