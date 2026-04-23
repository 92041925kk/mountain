<template>
  <div class="faq-page">
    <header class="page-header">
      <h1>常見問題</h1>
      <p>新手必看！關於登山社你想知道的一切</p>
    </header>

    <main class="container">
      <div class="faq-list">
        <div
          v-for="(item, index) in faqs"
          :key="index"
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
import { ref } from 'vue';

defineOptions({ name: 'FAQ' });

const activeIndex = ref(null);

const toggle = (index) => {
  activeIndex.value = activeIndex.value === index ? null : index;
};

const faqs = [
  {
    q: '沒有登山經驗可以加入嗎？',
    a: '當然可以！我們大部分社員都是大學才開始爬山的，社團會安排循序漸進的行程，從郊山到中級山再到百岳，讓你慢慢累積經驗。'
  },
  {
    q: '體力不好怎麼辦？',
    a: '不用擔心，出隊前我們會有體能訓練和行前說明，讓你了解行程難度。平時多跑步、爬樓梯就是很好的準備，社團也會依行程分級，選擇適合自己的隊伍即可。'
  },
  {
    q: '需要自備裝備嗎？',
    a: '社團出隊會準備帳篷和炊具的部分，個人裝備像背包、頭燈和睡袋可以向社團租借，而私人物品像是登山鞋、衣物等建議自行準備。剛入社不用急著買，可以先跟社團租，確定有興趣再慢慢添購。'
  },
  {
    q: '社費包含哪些東西？',
    a: '社費 650 元，加入後終身是社員。繳納社費後會贈送社服一件以及精美頭巾一條，社費主要用於社團運作、公裝維護等費用。每次出隊會另外收取額外費用。'
  },
  {
    q: '出隊頻率大概多久一次？',
    a: '學期中大約每 2～3 週出隊一次，寒暑假會有較長天數的縱走行程。你可以依自己的時間選擇參加，不需要每次都到。'
  },
  {
    q: '爬山危險嗎？安全措施有哪些？',
    a: '安全是我們最重視的事。每次出隊都會有經驗豐富的幹部帶隊、投保登山險、攜帶急救包與衛星通訊設備，並事前完成入山入園申請。行前也會有詳細的行程說明與天氣評估。'
  },
  {
    q: '大幾都可以加入嗎？研究生也可以嗎？',
    a: '只要是中原大學在學學生都歡迎加入，不限年級，研究生也沒問題！'
  },
  {
    q: '如何報名參加出隊？',
    a: '每次出隊會在 Facebook 社團和 LINE 群組公告，有興趣的話直接在上面報名即可。也可以關注我們的 IG 獲得最新消息。'
  }
];
</script>

<style scoped>
.faq-page {
  padding-bottom: 80px;
}

.page-header {
  background: linear-gradient(rgba(26, 67, 45, 0.8), rgba(26, 67, 45, 0.8)), url('https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=2070');
  background-size: cover;
  background-position: center;
  text-align: center;
  padding: 60px 20px;
  margin-bottom: 40px;
  color: white;
}
.page-header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  letter-spacing: 2px;
}
.page-header p {
  font-size: 1.1rem;
  opacity: 0.9;
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
  .page-header {
    padding: 35px 16px;
    margin-bottom: 24px;
  }
  .page-header h1 {
    font-size: 1.6rem;
  }
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
