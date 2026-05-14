<template>
  <nav class="navbar">
    <NuxtLink to="/" class="brand-link">
      <img src="https://i.postimg.cc/3xKj68f0/CYMC-qu-bei.png" alt="中原登山社 LOGO" class="brand-logo">
      <span class="brand-text">中原登山社</span>
    </NuxtLink>

    <button class="hamburger" :class="{ 'is-open': menuOpen }" @click="menuOpen = !menuOpen" aria-label="選單">
      <span></span>
      <span></span>
      <span></span>
    </button>

    <ul class="nav-links" :class="{ 'nav-open': menuOpen }">
      <li><NuxtLink to="/" @click="menuOpen = false">首頁</NuxtLink></li>
      <li><NuxtLink to="/history" @click="menuOpen = false">山社歷史</NuxtLink></li>
      <li><NuxtLink to="/gallery" @click="menuOpen = false">隊伍回顧</NuxtLink></li>
      <li><NuxtLink to="/schedule" @click="menuOpen = false">這學期隊伍</NuxtLink></li>
      <li><NuxtLink to="/join" @click="menuOpen = false">加入山社</NuxtLink></li>
    </ul>
  </nav>
</template>

<script setup>
import { ref } from 'vue';

const menuOpen = ref(false);
</script>
