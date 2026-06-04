<template>
  <div class="faq-page">
    <PageHeader title="常見問題" subtitle="新手必看！關於登山社你想知道的一切" />

    <main class="container">
      <div class="faq-list">
        <div
          v-for="(item, index) in faqs"
          :key="`${item.q}-${index}`"
          class="faq-card"
          data-aos="fade-up"
          :data-aos-delay="index * 60"
        >
          <button class="faq-question" @click="toggle(index)" :aria-expanded="activeIndex === index">
            <span>{{ item.q }}</span>
            <span class="faq-arrow" :class="{ 'is-open': activeIndex === index }">▼</span>
          </button>
          <div class="faq-answer" v-show="activeIndex === index">
            <p>{{ item.a }}</p>
          </div>
        </div>
      </div>

      <div class="faq-footer">
        <p>還有其他問題嗎？歡迎私訊我們的 IG 小編！</p>
        <a href="https://www.instagram.com/cycumtclub/" target="_blank" rel="noopener noreferrer" class="btn-ig">
          📩 IG 諮詢小編
        </a>
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import PageHeader from '../components/PageHeader.vue';
import { defaultSiteSettings, getSiteSettings } from '../utils/siteSettings';

defineOptions({ name: 'FAQ' });

const activeIndex = ref(null);
const faqs = ref([...defaultSiteSettings.faqItems]);

const toggle = (index) => {
  activeIndex.value = activeIndex.value === index ? null : index;
};

onMounted(async () => {
  const settings = await getSiteSettings();
  const cleanItems = normalizeFaqItems(settings.faqItems);
  if (cleanItems.length) faqs.value = cleanItems;
});

function normalizeFaqItems(items) {
  return Array.isArray(items)
    ? items
        .map((item) => ({
          q: String(item?.q || '').trim(),
          a: String(item?.a || '').trim(),
        }))
        .filter((item) => item.q && item.a)
    : [];
}
</script>

<style scoped>
.faq-page {
  padding-bottom: 80px;
}

.container {
  max-width: 750px;
  margin: 0 auto;
  padding: 0 20px;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.faq-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.faq-question {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 22px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.05rem;
  font-weight: bold;
  color: #1A432D;
  text-align: left;
  gap: 12px;
  transition: background-color 0.2s;
}
.faq-question:hover {
  background-color: #f8faf8;
}

.faq-arrow {
  font-size: 0.8rem;
  transition: transform 0.3s;
  flex-shrink: 0;
  color: #999;
}
.faq-arrow.is-open {
  transform: rotate(180deg);
  color: #E2C044;
}

.faq-answer {
  padding: 0 22px 20px;
  color: #555;
  font-size: 1rem;
  line-height: 1.8;
}

.faq-footer {
  text-align: center;
  margin-top: 50px;
  padding: 30px;
  background: #f9f9f9;
  border-radius: 12px;
}
.faq-footer p {
  color: #555;
  font-size: 1.05rem;
  margin-bottom: 16px;
}

.btn-ig {
  display: inline-block;
  background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);
  color: white;
  text-decoration: none;
  font-size: 1rem;
  font-weight: bold;
  padding: 12px 30px;
  border-radius: 25px;
  transition: transform 0.2s, box-shadow 0.2s;
}
.btn-ig:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

@media (max-width: 600px) {
  .faq-question {
    font-size: 0.97rem;
    padding: 15px 16px;
  }
  .faq-answer {
    padding: 0 16px 16px;
    font-size: 0.95rem;
  }
}
</style>
