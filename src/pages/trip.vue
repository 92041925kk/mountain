<template>
  <TripDetail />
</template>

<script setup>
import TripDetail from '~/views/TripDetail.vue'

definePageMeta({
  name: 'TripDetail',
})

usePageSeo('行程紀錄', '查看中原大學登山社隊伍的詳細行程、照片與天氣紀錄。')
</script>
