<template>
  <AdminTrips />
</template>

<script setup>
import AdminTrips from '~/views/admin/AdminTrips.vue'

definePageMeta({
  name: 'AdminTrips',
  isAdmin: true,
  requiresAuth: true,
  middleware: 'auth',
})

usePageSeo('行程紀錄管理')
</script>
