<template>
  <section class="help-panel" :class="{ open: isOpen }">
    <button class="help-toggle" type="button" @click="isOpen = !isOpen" :aria-expanded="isOpen">
      <span class="help-toggle-label">
        <span class="help-icon">💡</span>
        {{ title }}
      </span>
      <span class="help-arrow" :class="{ 'is-open': isOpen }">▼</span>
    </button>
    <div class="help-body" v-show="isOpen">
      <slot />
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  title: { type: String, default: '操作說明' },
  // 預設收合；若想預設展開可傳 :default-open="true"
  defaultOpen: { type: Boolean, default: false },
});

const isOpen = ref(false);
</script>

<style scoped>
.help-panel {
  background: #f3f8f4;
  border: 1px solid #d7e8dc;
  border-radius: 12px;
  overflow: hidden;
}
.help-panel.open { box-shadow: 0 2px 8px rgba(26, 67, 45, 0.06); }

.help-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 700;
  color: #1A432D;
  text-align: left;
}
.help-toggle-label { display: flex; align-items: center; gap: 8px; }
.help-icon { font-size: 1rem; }

.help-arrow {
  color: #1A432D;
  font-size: 0.8rem;
  transition: transform 0.25s ease;
  flex: 0 0 auto;
}
.help-arrow.is-open { transform: rotate(180deg); }

.help-body {
  padding: 4px 20px 20px;
  color: #3a4a40;
  font-size: 0.88rem;
  line-height: 1.7;
}

/* 提供給插槽內容的共用樣式 */
.help-body :deep(p) { margin: 0 0 10px; }
.help-body :deep(p:last-child) { margin-bottom: 0; }
.help-body :deep(ul) { margin: 0 0 10px; padding-left: 20px; }
.help-body :deep(li) { margin-bottom: 5px; }
.help-body :deep(strong) { color: #1A432D; }
.help-body :deep(code) {
  background: #e3efe7;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 0.85em;
}

.help-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 4px 0 12px;
  font-size: 0.85rem;
}
.help-body :deep(th),
.help-body :deep(td) {
  border: 1px solid #d7e8dc;
  padding: 7px 10px;
  text-align: left;
  vertical-align: top;
}
.help-body :deep(th) { background: #e7f1ea; color: #1A432D; font-weight: 700; }

.help-body :deep(.help-note) {
  background: #fff8e6;
  border-left: 3px solid #E2C044;
  padding: 8px 12px;
  border-radius: 0 6px 6px 0;
  margin: 10px 0 0;
  color: #6b5a1f;
}
</style>
