<template>
  <nav class="navbar">
    <router-link to="/" class="brand-link">
      <img src="https://i.postimg.cc/3xKj68f0/CYMC-qu-bei.png" alt="中原登山社 LOGO" class="brand-logo">
      <span class="brand-text">中原登山社</span>
    </router-link>

    <button class="hamburger" :class="{ 'is-open': menuOpen }" @click="menuOpen = !menuOpen" aria-label="選單">
      <span></span>
      <span></span>
      <span></span>
    </button>

    <ul class="nav-links" :class="{ 'nav-open': menuOpen }">
      <li><router-link to="/" @click="menuOpen = false">首頁</router-link></li>
      <li><router-link to="/history" @click="menuOpen = false">山社歷史</router-link></li>
      <li><router-link to="/gallery" @click="menuOpen = false">隊伍回顧</router-link></li>
      <li><router-link to="/schedule" @click="menuOpen = false">這學期隊伍</router-link></li>
      <li><router-link to="/join" @click="menuOpen = false">加入山社</router-link></li>
    </ul>
  </nav>
</template>

<script setup>
import { ref } from 'vue';

const menuOpen = ref(false);
</script>