<template>
  <Schedule />
</template>

<script setup>
import Schedule from '~/views/Schedule.vue'

definePageMeta({
  name: 'Schedule',
})

usePageSeo('這學期隊伍', '查看中原大學登山社本學期出隊行程與活動安排。')
</script>
