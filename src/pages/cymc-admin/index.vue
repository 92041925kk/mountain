<template>
  <AdminLogin />
</template>

<script setup>
import AdminLogin from '~/views/admin/AdminLogin.vue'

definePageMeta({
  name: 'AdminLogin',
  isAdmin: true,
})

usePageSeo('後台登入', '中原大學登山社網站後台登入。')
</script>
