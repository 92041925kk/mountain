<template>
  <AdminDashboard />
</template>

<script setup>
import AdminDashboard from '~/views/admin/AdminDashboard.vue'

definePageMeta({
  name: 'AdminDashboard',
  isAdmin: true,
  requiresAuth: true,
  middleware: 'auth',
})

usePageSeo('後台首頁')
</script>
