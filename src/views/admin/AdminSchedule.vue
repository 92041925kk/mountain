<template>
  <div class="admin-page">
    <AdminHeader title="行事曆管理" />

    <main class="admin-main">

      <!-- 學期選擇 -->
      <section class="admin-section">
        <h3>選擇學期</h3>
        <div class="semester-row">
          <input v-model="semester" placeholder="例：114-2" @keyup.enter="loadSchedule" />
          <button class="btn-primary" @click="loadSchedule" :disabled="!semester.trim() || isFetching">
            {{ isFetching ? '載入中...' : '載入' }}
          </button>
          <button class="btn-secondary" v-if="isLoaded" @click="createNew">新增學期</button>
        </div>
        <p class="hint-text" v-if="statusMsg" :class="statusClass">{{ statusMsg }}</p>
      </section>

      <!-- 行事曆編輯 -->
      <section class="admin-section" v-if="isLoaded">
        <div class="section-header">
          <div class="field-row-inline">
            <label>學期標題</label>
            <input v-model="scheduleTitle" placeholder="例：114-2 行事曆" style="width:220px" />
          </div>
          <div class="header-actions">
            <button class="btn-add" @click="addItem">＋ 新增行程</button>
            <button class="btn-primary" @click="saveSchedule" :disabled="isSaving">
              {{ isSaving ? '儲存中...' : '儲存全部' }}
            </button>
          </div>
        </div>

        <div class="items-list">
          <div v-if="items.length === 0" class="hint">尚無行程，點擊「新增行程」開始新增</div>

          <div v-for="(item, idx) in items" :key="idx" class="item-card">
            <div class="item-header">
              <span class="item-num">{{ idx + 1 }}</span>
              <button class="btn-del-item" @click="removeItem(idx)" title="刪除">✕</button>
            </div>
            <div class="item-fields">
              <div class="field-row">
                <label>日期</label>
                <input v-model="item.date" placeholder="例：5/1-5/3" />
              </div>
              <div class="field-row">
                <label>行程名稱</label>
                <input v-model="item.title" placeholder="例：白姑大山" />
              </div>
              <div class="field-row">
                <label>FB 連結（無則填「無」）</label>
                <input v-model="item.facebook_url" placeholder="https://..." />
              </div>
              <div class="field-row full-width">
                <label>行程簡介（選填）</label>
                <textarea v-model="item.description" placeholder="隊伍簡介..." rows="3"></textarea>
              </div>
            </div>
          </div>
        </div>

        <div class="save-row">
          <button class="btn-add" @click="addItem">＋ 新增行程</button>
          <button class="btn-primary" @click="saveSchedule" :disabled="isSaving">
            {{ isSaving ? '儲存中...' : '儲存全部' }}
          </button>
        </div>
      </section>

    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import AdminHeader from '../../components/admin/AdminHeader.vue';

const semester = ref('');
const scheduleTitle = ref('');
const items = ref([]);
const isLoaded = ref(false);
const isFetching = ref(false);
const isSaving = ref(false);
const statusMsg = ref('');
const statusClass = ref('');

function setStatus(msg, ok = true) {
  statusMsg.value = msg;
  statusClass.value = ok ? 'status-ok' : 'status-err';
  setTimeout(() => { statusMsg.value = ''; }, 3500);
}

async function loadSchedule() {
  if (!semester.value.trim()) return;
  isFetching.value = true;
  isLoaded.value = false;
  try {
    const snap = await getDoc(doc(db, 'schedules', semester.value.trim()));
    if (snap.exists()) {
      const data = snap.data();
      scheduleTitle.value = data.title || `${semester.value} 行事曆`;
      items.value = (data.items || []).map(i => ({ ...i }));
      isLoaded.value = true;
      setStatus(`已載入 ${items.value.length} 筆行程`);
    } else {
      setStatus('找不到此學期，可新增一個新學期', false);
      isLoaded.value = false;
    }
  } catch (e) {
    setStatus('載入失敗：' + e.message, false);
  } finally {
    isFetching.value = false;
  }
}

function createNew() {
  scheduleTitle.value = `${semester.value.trim()} 行事曆`;
  items.value = [];
  isLoaded.value = true;
  statusMsg.value = '';
}

function addItem() {
  items.value.push({ date: '', title: '', facebook_url: '', description: '' });
}

function removeItem(idx) {
  if (!confirm(`確定刪除第 ${idx + 1} 筆行程「${items.value[idx].title || '（未命名）'}」？`)) return;
  items.value.splice(idx, 1);
}

async function saveSchedule() {
  const sem = semester.value.trim();
  if (!sem) return;

  // 清理空欄位
  const cleanItems = items.value
    .filter(i => i.date || i.title)
    .map(i => {
      const obj = { date: i.date, title: i.title, facebook_url: i.facebook_url || '無' };
      if (i.description?.trim()) obj.description = i.description.trim();
      return obj;
    });

  isSaving.value = true;
  try {
    await setDoc(doc(db, 'schedules', sem), {
      semester: sem,
      title: scheduleTitle.value || `${sem} 行事曆`,
      items: cleanItems,
    });
    items.value = cleanItems.map(i => ({ ...i }));
    setStatus('✅ 儲存成功！');
  } catch (e) {
    setStatus('儲存失敗：' + e.message, false);
  } finally {
    isSaving.value = false;
  }
}
</script>

<style scoped>
.admin-page { min-height: 100vh; background: #f5f7f5; }
.admin-main { max-width: 900px; margin: 0 auto; padding: 32px 24px; display: flex; flex-direction: column; gap: 24px; }

.admin-section {
  background: white;
  border-radius: 14px;
  padding: 28px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
}
.admin-section h3 { color: #1A432D; font-size: 1.1rem; margin-bottom: 18px; }

.semester-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.semester-row input {
  padding: 9px 14px; border: 1px solid #ddd; border-radius: 8px;
  font-size: 1rem; width: 180px;
}
.semester-row input:focus { outline: none; border-color: #1A432D; }

.hint-text { margin-top: 10px; font-size: 0.88rem; }
.status-ok { color: #2e7d52; }
.status-err { color: #c0392b; }

.section-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
}
.field-row-inline { display: flex; align-items: center; gap: 10px; }
.field-row-inline label { font-size: 0.85rem; color: #666; font-weight: 600; white-space: nowrap; }
.field-row-inline input {
  padding: 8px 12px; border: 1px solid #ddd; border-radius: 7px; font-size: 0.95rem;
}
.field-row-inline input:focus { outline: none; border-color: #1A432D; }

.header-actions { display: flex; gap: 10px; }

.items-list { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }

.item-card {
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  padding: 16px;
  background: #fafafa;
}
.item-header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;
}
.item-num {
  background: #1A432D; color: white;
  width: 26px; height: 26px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.8rem; font-weight: bold;
}
.item-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.item-fields .full-width { grid-column: 1 / -1; }

.field-row { display: flex; flex-direction: column; gap: 5px; }
.field-row label { font-size: 0.8rem; color: #666; font-weight: 600; }
.field-row input, .field-row textarea {
  padding: 8px 12px; border: 1px solid #ddd; border-radius: 7px;
  font-size: 0.92rem; font-family: inherit; resize: vertical;
}
.field-row input:focus, .field-row textarea:focus { outline: none; border-color: #1A432D; }

.save-row { display: flex; justify-content: space-between; margin-top: 4px; }
.hint { color: #999; text-align: center; padding: 20px 0; }

.btn-del-item {
  background: none; border: 1px solid #ddd; color: #999;
  width: 28px; height: 28px; border-radius: 6px; cursor: pointer; font-size: 0.8rem;
  transition: all 0.2s;
}
.btn-del-item:hover { background: #fde8e8; border-color: #c0392b; color: #c0392b; }

.btn-add {
  background: #e8f5ee; color: #1A432D; border: 1px dashed #7db593;
  padding: 9px 18px; border-radius: 8px; font-size: 0.9rem; cursor: pointer;
  transition: background 0.2s;
}
.btn-add:hover { background: #d4ecdc; }

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

@media (max-width: 600px) {
  .item-fields { grid-template-columns: 1fr; }
  .item-fields .full-width { grid-column: 1; }
}
</style>
