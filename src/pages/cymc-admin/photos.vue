<template>
  <AdminPhotos />
</template>

<script setup>
import AdminPhotos from '~/views/admin/AdminPhotos.vue'

definePageMeta({
  name: 'AdminPhotos',
  isAdmin: true,
  requiresAuth: true,
  middleware: 'auth',
})

usePageSeo('照片管理')
</script>
