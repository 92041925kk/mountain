<template>
  <Home />
</template>

<script setup>
import Home from '~/views/Home.vue'

definePageMeta({
  name: 'Home',
})

usePageSeo(null, '中原大學登山社官方網站，收錄社史、學期隊伍、行程回顧、照片與入社資訊。')
</script>
