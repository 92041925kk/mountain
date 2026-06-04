<template>
  <div class="admin-page">
    <AdminHeader title="網站設定" />

    <main class="admin-main">
      <section class="admin-section">
        <h3>基本設定</h3>

        <div class="form-grid">
          <div class="field-row">
            <label>網站名稱</label>
            <input v-model="form.siteTitle" placeholder="中原大學登山社" />
          </div>
          <div class="field-row">
            <label>目前學期</label>
            <input v-model="form.currentSemester" placeholder="例：114-2" />
          </div>
          <div class="field-row full-width">
            <label>網站描述 / 分享摘要</label>
            <textarea v-model="form.siteDescription" rows="3" placeholder="走進山林，也走進一群一起前進的伙伴。"></textarea>
          </div>
        </div>
      </section>

      <section class="admin-section">
        <h3>首頁設定</h3>

        <div class="form-grid">
          <div class="field-row">
            <label>首頁標題</label>
            <input v-model="form.homeHeroTitle" placeholder="來都來了，來爬山吧" />
          </div>
          <div class="field-row">
            <label>首頁副標</label>
            <input v-model="form.homeHeroSubtitle" placeholder="一步一腳印，看見台灣之美" />
          </div>
          <div class="field-row">
            <label>首頁按鈕文字</label>
            <input v-model="form.homeCtaText" placeholder="立即加入" />
          </div>
          <div class="field-row">
            <label>首頁按鈕連結</label>
            <input v-model="form.homeCtaPath" placeholder="/join" />
          </div>
          <div class="field-row full-width">
            <label>首頁封面 Storage 路徑</label>
            <input v-model="form.homeHeroStoragePath" placeholder="photos/home/20240421_0535581.jpg" />
            <span class="field-hint">填 Firebase Storage 裡的物件路徑，不需要 gs://bucket。</span>
          </div>
          <div class="field-row">
            <label>介紹區標題</label>
            <input v-model="form.homeIntroTitle" placeholder="歡迎來到中原大學登山社" />
          </div>
          <div class="field-row">
            <label>照片牆標題</label>
            <input v-model="form.homePhotoWallTitle" placeholder="山林回憶" />
          </div>
          <div class="field-row full-width">
            <label>介紹區文字</label>
            <textarea v-model="form.homeIntroText" rows="4" placeholder="我們是一群熱愛山林、挑戰自我的夥伴。"></textarea>
          </div>
          <div class="field-row">
            <label>行程區標題</label>
            <input v-model="form.homeRecentTripsTitle" placeholder="即將出發" />
          </div>
          <div class="field-row">
            <label>首頁照片來源</label>
            <select v-model="form.homePhotoSource">
              <option value="latest">最新照片</option>
              <option value="featured">照片管理中標記的精選照片</option>
            </select>
          </div>
          <div class="field-row">
            <label>首頁照片數量上限</label>
            <input v-model.number="form.homePhotoLimit" type="number" min="6" max="60" step="1" />
          </div>
          <div class="field-row">
            <label>照片輪播秒數</label>
            <input v-model.number="form.homePhotoRotationSeconds" type="number" min="5" max="60" step="1" />
          </div>
          <div class="field-row full-width">
            <label>預設頁首圖片 URL</label>
            <input v-model="form.defaultPageHeaderImage" placeholder="https://..." />
          </div>
        </div>
      </section>

      <section class="admin-section">
        <div class="section-header">
          <h3>FAQ 常見問題</h3>
          <button class="btn-secondary" type="button" @click="addFaqItem">新增問題</button>
        </div>

        <div class="faq-editor">
          <div v-for="(item, index) in form.faqItems" :key="index" class="faq-edit-card">
            <div class="faq-card-header">
              <strong>問題 {{ index + 1 }}</strong>
              <div class="faq-actions">
                <button class="btn-secondary compact" type="button" @click="moveFaqItem(index, -1)" :disabled="index === 0">上移</button>
                <button class="btn-secondary compact" type="button" @click="moveFaqItem(index, 1)" :disabled="index === form.faqItems.length - 1">下移</button>
                <button class="btn-del compact" type="button" @click="removeFaqItem(index)" :disabled="form.faqItems.length === 1">刪除</button>
              </div>
            </div>
            <div class="field-row">
              <label>問題</label>
              <input v-model="item.q" placeholder="例：沒有登山經驗可以加入嗎？" />
            </div>
            <div class="field-row">
              <label>回答</label>
              <textarea v-model="item.a" rows="4" placeholder="輸入要顯示在 FAQ 頁面的回答"></textarea>
            </div>
          </div>
        </div>
      </section>

      <p class="status-msg" v-if="statusMsg" :class="statusClass">{{ statusMsg }}</p>

      <div class="form-actions">
        <button class="btn-secondary" @click="loadSettings" :disabled="isLoading">重新載入</button>
        <button class="btn-primary" @click="saveSettings" :disabled="isSaving">
          {{ isSaving ? '儲存中...' : '儲存設定' }}
        </button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import AdminHeader from '../../components/admin/AdminHeader.vue';
import { clearSiteSettingsCache, defaultSiteSettings } from '../../utils/siteSettings';

const form = ref({ ...defaultSiteSettings });
const isLoading = ref(false);
const isSaving = ref(false);
const statusMsg = ref('');
const statusClass = ref('');

function setStatus(msg, ok = true) {
  statusMsg.value = msg;
  statusClass.value = ok ? 'status-ok' : 'status-err';
}

async function loadSettings() {
  isLoading.value = true;
  try {
    const snap = await getDoc(doc(db, 'settings', 'site'));
    form.value = snap.exists()
      ? { ...defaultSiteSettings, ...snap.data() }
      : { ...defaultSiteSettings };
    form.value.faqItems = normalizeFaqItems(form.value.faqItems, { keepBlank: true });
    setStatus(snap.exists() ? '已載入網站設定' : '目前尚未建立設定，正在使用預設值');
  } catch (e) {
    setStatus('載入失敗：' + e.message, false);
  } finally {
    isLoading.value = false;
  }
}

async function saveSettings() {
  isSaving.value = true;
  try {
    const clean = Object.fromEntries(
      Object.entries(form.value).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
    );
    clean.homePhotoLimit = clampNumber(clean.homePhotoLimit, 6, 60, defaultSiteSettings.homePhotoLimit);
    clean.homePhotoRotationSeconds = clampNumber(
      clean.homePhotoRotationSeconds,
      5,
      60,
      defaultSiteSettings.homePhotoRotationSeconds
    );
    clean.faqItems = normalizeFaqItems(clean.faqItems);
    await setDoc(doc(db, 'settings', 'site'), clean, { merge: true });
    clearSiteSettingsCache();
    setStatus('✅ 設定已儲存');
  } catch (e) {
    setStatus('儲存失敗：' + e.message, false);
  } finally {
    isSaving.value = false;
  }
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

function normalizeFaqItems(items, options = {}) {
  const cleanItems = Array.isArray(items) ? items : defaultSiteSettings.faqItems;
  const normalized = cleanItems
    .map((item) => ({
      q: String(item?.q || '').trim(),
      a: String(item?.a || '').trim(),
    }))
    .filter((item) => options.keepBlank || (item.q && item.a));

  return normalized.length ? normalized : [{ q: '', a: '' }];
}

function addFaqItem() {
  form.value.faqItems.push({ q: '', a: '' });
}

function removeFaqItem(index) {
  if (form.value.faqItems.length === 1) return;
  form.value.faqItems.splice(index, 1);
}

function moveFaqItem(index, direction) {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= form.value.faqItems.length) return;
  const [item] = form.value.faqItems.splice(index, 1);
  form.value.faqItems.splice(targetIndex, 0, item);
}

onMounted(loadSettings);
</script>

<style scoped>
.admin-page { min-height: 100vh; background: #f5f7f5; }
.admin-main { max-width: 900px; margin: 0 auto; padding: 32px 24px; display: flex; flex-direction: column; gap: 24px; }
.admin-section { background: white; border-radius: 14px; padding: 28px; box-shadow: 0 2px 10px rgba(0,0,0,0.06); }
.admin-section h3 { color: #1A432D; font-size: 1.1rem; margin-bottom: 18px; }
.section-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 18px; }
.section-header h3 { margin: 0; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-grid .full-width { grid-column: 1 / -1; }
.field-row { display: flex; flex-direction: column; gap: 6px; }
.field-row label { font-size: 0.82rem; color: #555; font-weight: 600; }
.field-row input, .field-row textarea, .field-row select { padding: 9px 12px; border: 1px solid #ddd; border-radius: 7px; font-size: 0.95rem; font-family: inherit; }
.field-row input:focus, .field-row textarea:focus, .field-row select:focus { outline: none; border-color: #1A432D; }
.field-hint { color: #888; font-size: 0.8rem; }
.faq-editor { display: flex; flex-direction: column; gap: 14px; }
.faq-edit-card { display: flex; flex-direction: column; gap: 12px; padding: 16px; border: 1px solid #e2e9df; border-radius: 10px; background: #f8faf9; }
.faq-card-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.faq-card-header strong { color: #1A432D; }
.faq-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.status-msg { margin: 0; font-size: 0.9rem; }
.status-ok { color: #2e7d52; }
.status-err { color: #c0392b; }
.form-actions { display: flex; justify-content: flex-end; gap: 12px; }
.btn-primary, .btn-secondary { border: none; border-radius: 8px; padding: 9px 22px; font-size: 0.95rem; cursor: pointer; }
.btn-primary { background: #1A432D; color: white; font-weight: bold; }
.btn-secondary { background: #eee; color: #444; }
.btn-del { background: #fde8e8; color: #c0392b; border: none; border-radius: 8px; padding: 9px 18px; font-size: 0.9rem; cursor: pointer; }
.compact { padding: 6px 12px; font-size: 0.82rem; }
.btn-primary:disabled, .btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-del:disabled { opacity: 0.45; cursor: not-allowed; }

@media (max-width: 600px) {
  .form-grid { grid-template-columns: 1fr; }
  .form-grid .full-width { grid-column: auto; }
  .section-header, .faq-card-header { align-items: stretch; flex-direction: column; }
}
</style>
