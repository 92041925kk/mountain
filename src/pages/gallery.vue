<template>
  <Gallery />
</template>

<script setup>
import Gallery from '~/views/Gallery.vue'

definePageMeta({
  name: 'Gallery',
})

usePageSeo('隊伍回顧', '瀏覽中原大學登山社歷年隊伍紀錄與活動照片。')
</script>
