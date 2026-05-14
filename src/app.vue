<template>
  <NuxtLayout>
    <NuxtPage
      :keepalive="{ include: ['History', 'Join', 'FAQ'] }"
      :transition="{ name: 'page-fade', mode: 'out-in' }"
    />
  </NuxtLayout>
</template>
