<template>
  <AdminSchedule />
</template>

<script setup>
import AdminSchedule from '~/views/admin/AdminSchedule.vue'

definePageMeta({
  name: 'AdminSchedule',
  isAdmin: true,
  requiresAuth: true,
  middleware: 'auth',
})

usePageSeo('行事曆管理', undefined, { robots: 'noindex, nofollow' })
</script>
