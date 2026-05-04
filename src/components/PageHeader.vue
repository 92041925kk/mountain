<template>
  <header class="page-header" :style="headerStyle">
    <div class="page-header-inner">
      <p class="eyebrow" v-if="eyebrow">{{ eyebrow }}</p>
      <h1>{{ title }}</h1>
      <p v-if="subtitle">{{ subtitle }}</p>
    </div>
  </header>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { defaultSiteSettings, getSiteSettings } from '../utils/siteSettings';

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  eyebrow: { type: String, default: '' },
  image: { type: String, default: '' },
});

const settings = ref({ ...defaultSiteSettings });

const headerStyle = computed(() => {
  const image = props.image || settings.value.defaultPageHeaderImage;
  return {
    backgroundImage: `linear-gradient(rgba(26, 67, 45, 0.8), rgba(26, 67, 45, 0.76)), url("${image}")`,
  };
});

onMounted(async () => {
  settings.value = await getSiteSettings();
});
</script>

<style scoped>
.page-header {
  background-size: cover;
  background-position: center;
  color: white;
  text-align: center;
  padding: 64px 20px;
  margin-bottom: 40px;
}

.page-header-inner {
  max-width: 780px;
  margin: 0 auto;
}

.eyebrow {
  margin: 0 0 8px;
  color: #f0d27c;
  font-size: 0.82rem;
  font-weight: 800;
}

h1 {
  font-size: clamp(1.8rem, 5vw, 2.6rem);
  margin: 0 0 10px;
  letter-spacing: 2px;
}

p {
  margin: 0;
  font-size: 1.08rem;
  opacity: 0.9;
}

@media (max-width: 600px) {
  .page-header {
    padding: 38px 16px;
    margin-bottom: 24px;
  }

  p {
    font-size: 0.95rem;
  }
}
</style>
