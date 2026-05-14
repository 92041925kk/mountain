<template>
  <AdminSettings />
</template>

<script setup>
import AdminSettings from '~/views/admin/AdminSettings.vue'

definePageMeta({
  name: 'AdminSettings',
  isAdmin: true,
  requiresAuth: true,
  middleware: 'auth',
})

usePageSeo('網站設定')
</script>
