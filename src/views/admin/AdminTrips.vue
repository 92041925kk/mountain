<template>
  <div class="admin-page">
    <AdminHeader title="行程紀錄管理" />

    <main class="admin-main">

      <!-- 行程列表 -->
      <section class="admin-section">
        <div class="section-header">
          <h3>所有行程紀錄（{{ trips.length }} 筆）</h3>
          <div class="header-actions">
            <button class="btn-secondary" @click="loadTrips">重新整理</button>
            <button class="btn-primary" @click="openForm(null)">＋ 新增行程</button>
          </div>
        </div>

        <div v-if="isFetching" class="hint">載入中...</div>
        <div v-else-if="trips.length === 0" class="hint">尚無行程紀錄</div>
        <div v-else class="trips-list">
          <div v-for="trip in trips" :key="trip.id" class="trip-row">
            <div class="trip-meta">
              <span class="trip-title">{{ trip.title }}</span>
              <div class="trip-tags">
                <span class="tag">{{ trip.semester }}</span>
                <span class="tag">{{ trip.days }}</span>
                <span class="tag tag-diff">{{ trip.difficulty }}</span>
              </div>
            </div>
            <div class="trip-actions">
              <button class="btn-edit" @click="openForm(trip)">編輯</button>
              <button class="btn-del" @click="deleteTrip(trip)">刪除</button>
            </div>
          </div>
        </div>
      </section>

      <!-- 新增 / 編輯表單 -->
      <section class="admin-section" v-if="showForm">
        <h3>{{ editingId ? '編輯行程' : '新增行程' }}</h3>

        <div class="form-grid">
          <div class="field-row">
            <label>行程 ID <span class="required">*</span></label>
            <input v-model="form.id" placeholder="例：laomei-creek-2026" :disabled="!!editingId" />
            <span class="field-hint">英文小寫 + 數字 + 連字號，建立後不可更改</span>
          </div>
          <div class="field-row">
            <label>行程名稱 <span class="required">*</span></label>
            <input v-model="form.title" placeholder="例：老梅溪溯溪 - 梅好溯光" />
          </div>
          <div class="field-row">
            <label>學期</label>
            <input v-model="form.semester" placeholder="例：114-2" />
          </div>
          <div class="field-row">
            <label>天數</label>
            <input v-model="form.days" placeholder="例：單日、三天兩夜" />
          </div>
          <div class="field-row">
            <label>難度 / 類型</label>
            <input v-model="form.difficulty" placeholder="例：溯溪體驗、百岳縱走" />
          </div>
          <div class="field-row full-width">
            <label>封面圖片 URL</label>
            <input v-model="form.coverImage" placeholder="https://..." />
            <img v-if="form.coverImage" :src="form.coverImage" class="cover-preview" />
          </div>
          <div class="field-row full-width">
            <label>行程計畫（JSON）<span class="required">*</span></label>
            <textarea
              v-model="planJson"
              rows="18"
              spellcheck="false"
              class="json-editor"
              placeholder='[{"dayLabel":"D1 (9/24)","items":[{"time":"08:40","location":"集合地點","info":"說明","type":"light"}]}]'
            ></textarea>
            <span class="field-hint json-hint" :class="jsonValid ? 'hint-ok' : 'hint-err'">
              {{ jsonValid ? '✅ JSON 格式正確' : '❌ JSON 格式錯誤，請修正後再儲存' }}
            </span>
          </div>
        </div>

        <p class="status-msg" v-if="formStatus" :class="formStatusClass">{{ formStatus }}</p>

        <div class="form-actions">
          <button class="btn-secondary" @click="closeForm">取消</button>
          <button class="btn-primary" @click="saveTrip" :disabled="isSaving || !jsonValid">
            {{ isSaving ? '儲存中...' : (editingId ? '更新行程' : '建立行程') }}
          </button>
        </div>
      </section>

    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { collection, getDocs, setDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import AdminHeader from '../../components/admin/AdminHeader.vue';

const trips = ref([]);
const isFetching = ref(false);
const isSaving = ref(false);
const showForm = ref(false);
const editingId = ref(null);
const formStatus = ref('');
const formStatusClass = ref('');

const form = ref({ id: '', title: '', semester: '', days: '', difficulty: '', coverImage: '' });
const planJson = ref('[\n  {\n    "dayLabel": "D1 (日期)",\n    "items": [\n      { "time": "09:00", "location": "集合地點", "info": "說明", "type": "light" }\n    ]\n  }\n]');

const jsonValid = computed(() => {
  try { JSON.parse(planJson.value); return true; } catch { return false; }
});

async function loadTrips() {
  isFetching.value = true;
  try {
    const snap = await getDocs(collection(db, 'trip'));
    trips.value = snap.docs.map(d => ({ ...d.data() })).sort((a, b) =>
      (b.semester || '').localeCompare(a.semester || '')
    );
  } finally {
    isFetching.value = false;
  }
}

function openForm(trip) {
  if (trip) {
    editingId.value = trip.id;
    form.value = {
      id: trip.id || '',
      title: trip.title || '',
      semester: trip.semester || '',
      days: trip.days || '',
      difficulty: trip.difficulty || '',
      coverImage: trip.coverImage || '',
    };
    planJson.value = JSON.stringify(trip.plan || [], null, 2);
  } else {
    editingId.value = null;
    form.value = { id: '', title: '', semester: '', days: '', difficulty: '', coverImage: '' };
    planJson.value = '[\n  {\n    "dayLabel": "D1 (日期)",\n    "items": [\n      { "time": "09:00", "location": "集合地點", "info": "說明", "type": "light" }\n    ]\n  }\n]';
  }
  showForm.value = true;
  formStatus.value = '';
  setTimeout(() => document.querySelector('.admin-section:last-child')?.scrollIntoView({ behavior: 'smooth' }), 100);
}

function closeForm() {
  showForm.value = false;
  editingId.value = null;
}

function setStatus(msg, ok = true) {
  formStatus.value = msg;
  formStatusClass.value = ok ? 'status-ok' : 'status-err';
  if (ok) setTimeout(() => { formStatus.value = ''; }, 3000);
}

async function saveTrip() {
  if (!form.value.id.trim() || !form.value.title.trim()) {
    setStatus('行程 ID 和名稱為必填', false);
    return;
  }
  if (!jsonValid.value) return;

  isSaving.value = true;
  try {
    const plan = JSON.parse(planJson.value);
    const data = { ...form.value, plan };
    if (!data.coverImage) delete data.coverImage;
    await setDoc(doc(db, 'trip', form.value.id.trim()), data);
    setStatus('✅ 儲存成功！');
    await loadTrips();
    closeForm();
  } catch (e) {
    setStatus('儲存失敗：' + e.message, false);
  } finally {
    isSaving.value = false;
  }
}

async function deleteTrip(trip) {
  if (!confirm(`確定刪除行程「${trip.title}」？\nID: ${trip.id}\n\n此操作無法復原。`)) return;
  try {
    await deleteDoc(doc(db, 'trip', trip.id));
    trips.value = trips.value.filter(t => t.id !== trip.id);
  } catch (e) {
    alert('刪除失敗：' + e.message);
  }
}

onMounted(loadTrips);
</script>

<style scoped>
.admin-page { min-height: 100vh; background: #f5f7f5; }
.admin-main { max-width: 950px; margin: 0 auto; padding: 32px 24px; display: flex; flex-direction: column; gap: 24px; }

.admin-section {
  background: white; border-radius: 14px; padding: 28px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
}
.admin-section h3 { color: #1A432D; font-size: 1.1rem; margin-bottom: 18px; }

.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; flex-wrap: wrap; gap: 10px; }
.section-header h3 { margin: 0; }
.header-actions { display: flex; gap: 10px; }

.trips-list { display: flex; flex-direction: column; gap: 10px; }
.trip-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 16px; border-radius: 9px; background: #f9f9f9;
  border: 1px solid #eee;
}
.trip-meta { display: flex; flex-direction: column; gap: 6px; }
.trip-title { font-weight: 600; color: #1A432D; font-size: 0.95rem; }
.trip-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.tag {
  background: #e8f5ee; color: #2e7d52;
  font-size: 0.75rem; padding: 2px 10px; border-radius: 20px;
}
.tag-diff { background: #fff3e0; color: #e65100; }
.trip-actions { display: flex; gap: 8px; }

/* Form */
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
.form-grid .full-width { grid-column: 1 / -1; }

.field-row { display: flex; flex-direction: column; gap: 5px; }
.field-row label { font-size: 0.82rem; color: #555; font-weight: 600; }
.required { color: #c0392b; }
.field-row input, .field-row textarea {
  padding: 9px 12px; border: 1px solid #ddd; border-radius: 7px;
  font-size: 0.92rem; font-family: inherit;
}
.field-row input:focus, .field-row textarea:focus { outline: none; border-color: #1A432D; }
.field-row input:disabled { background: #f5f5f5; color: #999; }
.field-hint { font-size: 0.78rem; color: #999; }
.hint-ok { color: #2e7d52; }
.hint-err { color: #c0392b; }
.json-editor { font-family: 'Consolas', 'Monaco', monospace; font-size: 0.85rem; line-height: 1.5; }
.cover-preview { width: 120px; height: 80px; object-fit: cover; border-radius: 6px; margin-top: 6px; }
.json-hint { font-weight: 600; margin-top: 4px; }

.status-msg { font-size: 0.88rem; margin-bottom: 14px; }
.status-ok { color: #2e7d52; }
.status-err { color: #c0392b; }

.form-actions { display: flex; gap: 12px; justify-content: flex-end; }
.hint { color: #999; text-align: center; padding: 20px 0; }

.btn-primary {
  background: #1A432D; color: white; border: none;
  padding: 9px 22px; border-radius: 8px; font-size: 0.95rem;
  font-weight: bold; cursor: pointer; transition: background 0.2s;
}
.btn-primary:hover:not(:disabled) { background: #245c3d; }
.btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
.btn-secondary {
  background: #eee; color: #444; border: none;
  padding: 9px 18px; border-radius: 8px; font-size: 0.9rem;
  cursor: pointer; transition: background 0.2s;
}
.btn-secondary:hover { background: #ddd; }
.btn-edit {
  background: #e8f0ff; color: #1a5276; border: none;
  padding: 6px 16px; border-radius: 7px; font-size: 0.85rem; cursor: pointer;
  transition: background 0.2s;
}
.btn-edit:hover { background: #d0e4ff; }
.btn-del {
  background: #fde8e8; color: #c0392b; border: none;
  padding: 6px 16px; border-radius: 7px; font-size: 0.85rem; cursor: pointer;
  transition: background 0.2s;
}
.btn-del:hover { background: #f5c6c6; }

@media (max-width: 600px) {
  .form-grid { grid-template-columns: 1fr; }
  .form-grid .full-width { grid-column: 1; }
  .trip-row { flex-direction: column; align-items: flex-start; gap: 10px; }
}
</style>
