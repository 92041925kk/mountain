<template>
  <div class="history-page">
    <header class="history-hero">
      <div class="hero-inner">
        <p class="eyebrow">Since {{ historySummary.founded }}</p>
        <h1>山社歷史</h1>
        <p>從綠野登山社走來，一路把技術、安全與情感傳下去。</p>
      </div>
    </header>

    <main>
      <section class="intro-band">
        <div class="container intro-layout">
          <div class="intro-copy" data-aos="fade-up">
            <p class="section-kicker">社史總述</p>
            <h2>一條由社員、嚮導與校友共同走出的山路</h2>
            <p>{{ historySummary.intro }}</p>
            <p>{{ historySummary.closing }}</p>
          </div>

          <div class="fact-grid" data-aos="fade-up" data-aos-delay="80">
            <div class="fact-item">
              <strong>{{ historySummary.founded }}</strong>
              <span>創社年份</span>
            </div>
            <div class="fact-item">
              <strong>{{ historySummary.anniversary }}</strong>
              <span>傳承年數</span>
            </div>
            <div class="fact-item wide">
              <strong>{{ historySummary.roots }}</strong>
              <span>山社前身</span>
            </div>
          </div>
        </div>
      </section>

      <section class="container era-section">
        <div class="section-heading" data-aos="fade-up">
          <p class="section-kicker">發展脈絡</p>
          <h2>六個階段，看見山社怎麼走到今天</h2>
        </div>

        <div class="era-grid">
          <article
            v-for="(era, index) in historyEras"
            :key="era.title"
            class="era-panel"
            data-aos="fade-up"
            :data-aos-delay="(index % 3) * 80"
          >
            <span class="era-period">{{ era.period }}</span>
            <h3>{{ era.title }}</h3>
            <p>{{ era.summary }}</p>
            <ul>
              <li v-for="item in era.highlights" :key="item">{{ item }}</li>
            </ul>
          </article>
        </div>
      </section>

      <section class="milestone-band">
        <div class="container">
          <div class="section-heading light" data-aos="fade-up">
            <p class="section-kicker">重要里程碑</p>
            <h2>把山社形狀刻出來的幾個時間點</h2>
          </div>

          <div class="milestone-grid">
            <article
              v-for="(item, index) in featuredMilestones"
              :key="item.year + item.title"
              class="milestone-item"
              data-aos="fade-up"
              :data-aos-delay="(index % 3) * 80"
            >
              <span>{{ item.year }}</span>
              <h3>{{ item.title }}</h3>
              <p>{{ item.text }}</p>
            </article>
          </div>
        </div>
      </section>

      <section class="container timeline-section">
        <div class="timeline-heading" data-aos="fade-up">
          <div>
            <p class="section-kicker">完整年表</p>
            <h2>從 1970 到現在</h2>
          </div>
          <div class="category-tabs" aria-label="社史分類">
            <button
              v-for="category in historyCategories"
              :key="category.value"
              type="button"
              :class="{ active: activeCategory === category.value }"
              @click="activeCategory = category.value"
            >
              {{ category.label }}
            </button>
          </div>
        </div>

        <div class="timeline-list">
          <article
            v-for="entry in filteredTimeline"
            :key="entry.time + entry.title"
            class="timeline-entry"
            data-aos="fade-up"
          >
            <div class="timeline-date">
              <strong>{{ entry.displayTime }}</strong>
              <span>{{ entry.phase }}</span>
            </div>
            <div class="timeline-content">
              <h3>{{ entry.title }}</h3>
              <p>{{ entry.text }}</p>
              <p class="entry-note" v-if="entry.note">{{ entry.note }}</p>
              <span class="source-label">{{ entry.source }}</span>
            </div>
          </article>
        </div>
      </section>

      <section class="source-band">
        <div class="container">
          <div class="section-heading" data-aos="fade-up">
            <p class="section-kicker">資料來源</p>
            <h2>整理依據</h2>
          </div>

          <div class="source-list">
            <a
              v-for="source in historySources"
              :key="source.url"
              :href="source.url"
              target="_blank"
              rel="noopener noreferrer"
              class="source-item"
            >
              <strong>{{ source.name }}</strong>
              <span>{{ source.description }}</span>
            </a>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import {
  featuredMilestones,
  historyCategories,
  historyEras,
  historySources,
  historySummary,
  timelineEntries,
} from '../data/history';

defineOptions({ name: 'History' });

const activeCategory = ref('all');

const filteredTimeline = computed(() => {
  if (activeCategory.value === 'all') return timelineEntries;
  return timelineEntries.filter((entry) => entry.category === activeCategory.value);
});
</script>

<style scoped>
.history-page {
  background: #f6f8f4;
  color: #243c2e;
}

.container {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 24px;
}

.history-hero {
  min-height: 50vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: white;
  background:
    linear-gradient(rgba(20, 54, 37, 0.72), rgba(20, 54, 37, 0.66)),
    url('https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=2070') center 58%/cover no-repeat;
}

.hero-inner {
  position: relative;
  max-width: 780px;
  padding: 70px 24px;
}

.hero-inner::after {
  content: '';
  display: block;
  width: 72px;
  height: 4px;
  margin: 28px auto 0;
  border-radius: 2px;
  background: #E2C044;
}

.eyebrow,
.section-kicker {
  margin: 0 0 10px;
  color: #b8892f;
  font-size: 0.84rem;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.history-hero .eyebrow {
  color: #f0d27c;
}

.history-hero h1 {
  margin: 0 0 14px;
  font-size: clamp(2.4rem, 7vw, 4.6rem);
  line-height: 1.05;
}

.history-hero p:last-child {
  margin: 0;
  font-size: clamp(1rem, 2.5vw, 1.3rem);
  color: rgba(255, 255, 255, 0.9);
}

.intro-band,
.source-band {
  background: white;
  padding: 76px 0;
}

.intro-band {
  border-bottom: 1px solid #e2e9df;
}

.intro-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(280px, 0.75fr);
  gap: 44px;
  align-items: center;
}

.intro-copy h2,
.section-heading h2,
.timeline-heading h2 {
  margin: 0;
  color: #1A432D;
  font-size: clamp(1.7rem, 4vw, 2.45rem);
  line-height: 1.25;
}

.intro-copy p:not(.section-kicker) {
  margin: 18px 0 0;
  color: #4d5a50;
  font-size: 1.06rem;
  line-height: 1.9;
}

.fact-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.fact-item {
  min-height: 122px;
  padding: 22px;
  border-radius: 8px;
  background: #f6f8f4;
  border: 1px solid #e3eadf;
  border-left: 4px solid #E2C044;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.fact-item.wide {
  grid-column: 1 / -1;
}

.fact-item strong {
  color: #1A432D;
  font-size: clamp(1.55rem, 3vw, 2.2rem);
  line-height: 1.2;
}

.fact-item span {
  margin-top: 8px;
  color: #6c766f;
  font-size: 0.95rem;
}

.era-section,
.timeline-section {
  padding: 82px 24px;
}

.section-heading {
  max-width: 720px;
  margin-bottom: 34px;
}

.section-heading.light h2,
.section-heading.light .section-kicker {
  color: white;
}

.era-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.era-panel {
  background: white;
  border-radius: 8px;
  padding: 26px;
  border: 1px solid #e2e9df;
  box-shadow: 0 8px 24px rgba(26, 67, 45, 0.06);
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}

.era-panel:hover {
  transform: translateY(-3px);
  border-color: #cbd8c8;
  box-shadow: 0 12px 28px rgba(26, 67, 45, 0.09);
}

.era-period {
  display: inline-flex;
  margin-bottom: 14px;
  color: #936b22;
  font-size: 0.82rem;
  font-weight: 800;
}

.era-panel h3,
.milestone-item h3,
.timeline-content h3 {
  margin: 0;
  color: #1A432D;
  line-height: 1.35;
}

.era-panel h3 {
  font-size: 1.18rem;
}

.era-panel p,
.milestone-item p,
.timeline-content p {
  margin: 12px 0 0;
  color: #536059;
  line-height: 1.75;
}

.era-panel ul {
  margin: 18px 0 0;
  padding-left: 18px;
  color: #3f5248;
  line-height: 1.8;
}

.milestone-band {
  padding: 80px 0;
  background: #1A432D;
}

.milestone-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.milestone-item {
  min-height: 210px;
  padding: 25px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.96);
  border-top: 4px solid #E2C044;
}

.milestone-item span {
  display: inline-block;
  margin-bottom: 18px;
  color: #a67b25;
  font-weight: 900;
  font-size: 1.8rem;
  line-height: 1;
}

.timeline-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  margin-bottom: 34px;
}

.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.category-tabs button {
  border: 1px solid #b8cbbf;
  background: white;
  color: #1A432D;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  transition: background-color 0.2s, color 0.2s, border-color 0.2s;
}

.category-tabs button:hover,
.category-tabs button.active {
  background: #1A432D;
  color: white;
  border-color: #1A432D;
}

.timeline-list {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.timeline-entry {
  display: grid;
  grid-template-columns: 290px minmax(0, 1fr);
  gap: 26px;
  align-items: stretch;
}

.timeline-date {
  padding: 20px 0 0;
  text-align: right;
}

.timeline-date strong {
  display: block;
  color: #1A432D;
  font-size: 1rem;
  line-height: 1.5;
  white-space: nowrap;
}

.timeline-date span {
  display: inline-block;
  margin-top: 7px;
  color: #916c28;
  font-size: 0.86rem;
  font-weight: 800;
}

.timeline-content {
  position: relative;
  padding: 22px 24px 22px 30px;
  border-radius: 8px;
  background: white;
  border: 1px solid #e2e9df;
  border-left: 4px solid #E2C044;
  box-shadow: 0 8px 24px rgba(26, 67, 45, 0.05);
}

.timeline-content::before {
  content: '';
  position: absolute;
  left: -20px;
  top: 30px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #E2C044;
  box-shadow: 0 0 0 6px #f6f8f4;
}

.timeline-content::after {
  content: '';
  position: absolute;
  left: -15px;
  top: 42px;
  bottom: -38px;
  width: 2px;
  background: #c8d9cd;
}

.timeline-entry:last-child .timeline-content::after {
  display: none;
}

.entry-note {
  padding: 10px 12px;
  border-radius: 6px;
  background: #f6f0df;
  color: #70521a !important;
  font-size: 0.92rem;
}

.source-label {
  display: inline-flex;
  margin-top: 14px;
  color: #7b867f;
  font-size: 0.82rem;
  font-weight: 700;
}

.source-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.source-item {
  display: block;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e2e9df;
  color: inherit;
  text-decoration: none;
  background: #f9fbf7;
  transition: transform 0.2s, border-color 0.2s;
}

.source-item:hover {
  transform: translateY(-2px);
  border-color: #b8cbbf;
}

.source-item strong {
  display: block;
  color: #1A432D;
  margin-bottom: 7px;
}

.source-item span {
  color: #5c6961;
  font-size: 0.93rem;
  line-height: 1.65;
}

@media (max-width: 980px) {
  .intro-layout,
  .era-grid,
  .milestone-grid,
  .source-list {
    grid-template-columns: 1fr 1fr;
  }

  .timeline-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .category-tabs {
    justify-content: flex-start;
  }

  .timeline-entry {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .timeline-date {
    text-align: left;
    padding: 0;
  }

  .timeline-content::before,
  .timeline-content::after {
    display: none;
  }
}

@media (max-width: 640px) {
  .container,
  .era-section,
  .timeline-section {
    padding-left: 18px;
    padding-right: 18px;
  }

  .history-hero {
    min-height: 46vh;
  }

  .intro-band,
  .source-band,
  .era-section,
  .timeline-section,
  .milestone-band {
    padding-top: 54px;
    padding-bottom: 54px;
  }

  .intro-layout,
  .fact-grid,
  .era-grid,
  .milestone-grid,
  .source-list {
    grid-template-columns: 1fr;
  }

  .fact-item.wide {
    grid-column: auto;
  }

  .timeline-content {
    padding: 20px;
  }
}
</style>
