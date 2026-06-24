<template>
  <div class="admin-page">
    <AdminHeader title="行事曆管理" />

    <main class="admin-main">

      <AdminHelpPanel title="操作說明：行事曆與「隊伍狀態」怎麼運作？">
        <p>輸入學期（例：<code>114-2</code>）按「載入」即可編輯；新學期會出現「建立新學期」。每筆行程填日期、名稱、FB／報名連結與簡介，改完按「<strong>儲存全部</strong>」。</p>
        <ul>
          <li><strong>日期</strong>要寫成 <code>5/1</code> 或 <code>5/1-5/3</code>（斜線＋減號，不要寫「5月1日」，否則首頁與「平安下山」判斷會失效）。</li>
          <li><strong>報名表單限 Google 表單</strong>（<code>forms.gle</code> 或 <code>docs.google.com/forms</code>）；貼錯會變黃並擋下儲存。</li>
        </ul>
        <p>每支隊伍在前台只會顯示<strong>一個</strong>狀態徽章，由上而下先符合先顯示：</p>
        <table>
          <thead>
            <tr><th>前台顯示</th><th>出現條件</th><th>由誰控制</th></tr>
          </thead>
          <tbody>
            <tr><td>灰色刪節線「<strong>倒隊</strong>」</td><td>勾選了「倒隊」</td><td>幹部手動勾</td></tr>
            <tr><td>綠色「<strong>⛰ 平安下山</strong>」</td><td>行程日期已經過了</td><td><strong>自動</strong>，不用設定</td></tr>
            <tr><td>綠色「<strong>報名表單／立即報名</strong>」</td><td>有貼 Google 表單，且未勾「報名已截止」</td><td>幹部貼連結</td></tr>
            <tr><td>紅色「<strong>報名已截止</strong>」</td><td>有貼連結，且勾了「報名已截止」</td><td>幹部手動勾</td></tr>
            <tr><td>灰色「<strong>報名尚未開放</strong>」</td><td>沒貼報名連結</td><td>留空即是</td></tr>
          </tbody>
        </table>
        <p class="help-note">「平安下山」是依日期<strong>自動</strong>切換的，出隊日一過隔天就會變，幹部不用手動改。只有「倒隊」「報名已截止」需要手動勾。</p>
      </AdminHelpPanel>

      <!-- 學期選擇 -->
      <section class="admin-section">
        <h3>選擇學期</h3>
        <div class="semester-row">
          <input v-model="semester" placeholder="例：114-2" @keyup.enter="loadSchedule" />
          <button class="btn-primary" @click="loadSchedule" :disabled="!semester.trim() || isFetching">
            {{ isFetching ? '載入中...' : '載入' }}
          </button>
          <button class="btn-secondary" v-if="canCreateNew" @click="createNew">建立新學期</button>
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
                <input
                  v-model="item.date"
                  placeholder="例：5/1 或 5/1-5/3"
                  :class="{ 'input-warn': item.date && !isValidScheduleDate(item.date) }"
                />
                <span class="date-hint" :class="{ 'date-hint-warn': item.date && !isValidScheduleDate(item.date) }">
                  <template v-if="item.date && !isValidScheduleDate(item.date)">
                    ⚠️ 格式可能有誤，請用「月/日」如 5/1 或 5/1-5/3，首頁才抓得到
                  </template>
                  <template v-else>
                    請用「月/日」格式，例：5/1、5/1-5/3（不要寫「5月1日」）
                  </template>
                </span>
              </div>
              <div class="field-row">
                <label>行程名稱</label>
                <input v-model="item.title" placeholder="例：白姑大山" />
              </div>
              <div class="field-row">
                <label>FB 連結（無則填「無」）</label>
                <input
                  v-model="item.facebook_url"
                  placeholder="https://www.facebook.com/..."
                  :class="{ 'input-warn': isFbInvalid(item.facebook_url) }"
                />
                <span class="signup-hint signup-hint-warn" v-if="isFbInvalid(item.facebook_url)">
                  ⚠️ 這看起來不像 Facebook 連結，請確認網址（沒有 FB 就填「無」）
                </span>
              </div>
              <div class="field-row full-width">
                <label>報名表單連結（選填，限 Google 表單；留空前台會顯示「報名尚未開放」）</label>
                <input
                  v-model="item.signup_url"
                  placeholder="貼上 Google 表單連結，例：https://forms.gle/... 或 https://docs.google.com/forms/..."
                  :class="{ 'input-warn': isSignupInvalid(item.signup_url) }"
                />
                <span class="signup-hint" :class="signupHintClass(item.signup_url)">
                  <template v-if="!item.signup_url || !item.signup_url.trim()">
                    ⚠️ 尚未貼上連結，前台這支隊伍會顯示「報名尚未開放」
                  </template>
                  <template v-else-if="isSignupInvalid(item.signup_url)">
                    ⚠️ 這不是有效的 Google 表單連結，請貼 forms.gle 或 docs.google.com/forms 的網址
                  </template>
                  <template v-else>
                    ✅ 前台會依下方日期自動顯示「報名中／尚未開放／已截止」
                  </template>
                </span>

                <div class="signup-dates">
                  <label class="signup-date-field">
                    報名開始日期
                    <input type="date" v-model="item.signup_start" :max="item.signup_end || undefined" />
                  </label>
                  <label class="signup-date-field">
                    報名截止日期
                    <input type="date" v-model="item.signup_end" :min="item.signup_start || undefined" />
                  </label>
                </div>
                <span class="signup-hint" :class="{ 'signup-hint-warn': isSignupDateRangeInvalid(item) }">
                  <template v-if="isSignupDateRangeInvalid(item)">
                    ⚠️ 截止日期不能早於開始日期，請修正
                  </template>
                  <template v-else>
                    兩個日期都可留空。開始日之前顯示「報名尚未開放」、截止日當天仍可報名、過了截止日顯示「報名已截止」。
                  </template>
                </span>

                <label class="signup-closed-toggle">
                  <input type="checkbox" v-model="item.signup_closed" />
                  立即關閉報名（不論上面日期，前台直接顯示「報名已截止」）
                </label>
                <label class="signup-closed-toggle cancelled-toggle">
                  <input type="checkbox" v-model="item.cancelled" />
                  倒隊（這次無法出隊；勾選後前台改顯示「倒隊」，並蓋過其他狀態）
                </label>
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
import { computed, ref } from 'vue';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { isGoogleFormUrl, isFacebookUrl } from '../../utils/links';
import AdminHeader from '../../components/admin/AdminHeader.vue';
import AdminHelpPanel from '../../components/admin/AdminHelpPanel.vue';

const semester = ref('');
const scheduleTitle = ref('');
const items = ref([]);
const isLoaded = ref(false);
const isFetching = ref(false);
const isSaving = ref(false);
const statusMsg = ref('');
const statusClass = ref('');
const missingSemester = ref('');
const canCreateNew = computed(() =>
  missingSemester.value === semester.value.trim() && !isLoaded.value && !isFetching.value
);

function setStatus(msg, ok = true) {
  statusMsg.value = msg;
  statusClass.value = ok ? 'status-ok' : 'status-err';
  setTimeout(() => { statusMsg.value = ''; }, 3500);
}

async function loadSchedule() {
  if (!semester.value.trim()) return;
  isFetching.value = true;
  isLoaded.value = false;
  missingSemester.value = '';
  try {
    const snap = await getDoc(doc(db, 'schedules', semester.value.trim()));
    if (snap.exists()) {
      const data = snap.data();
      scheduleTitle.value = data.title || `${semester.value} 行事曆`;
      items.value = (data.items || []).map(i => ({ ...i }));
      isLoaded.value = true;
      setStatus(`已載入 ${items.value.length} 筆行程`);
    } else {
      missingSemester.value = semester.value.trim();
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
  missingSemester.value = '';
  statusMsg.value = '';
}

// 與首頁 Home.vue 解析行事曆日期的邏輯一致：取第一段、需為「月/日」
function isValidScheduleDate(dateStr) {
  const firstPart = String(dateStr || '').split('-')[0].trim();
  const parts = firstPart.split('/');
  if (parts.length < 2) return false;
  const month = Number(parts[0]);
  const day = Number(parts[1]);
  return Number.isInteger(month) && month >= 1 && month <= 12
    && Number.isInteger(day) && day >= 1 && day <= 31;
}

// 報名連結：有填且不是合法 Google 表單 → 視為錯誤（空白或「無」不算錯）
function isSignupInvalid(url) {
  const trimmed = String(url || '').trim();
  if (trimmed === '' || trimmed === '無') return false;
  return !isGoogleFormUrl(trimmed);
}

// FB 連結：有填且不是「無」也不是合法 Facebook 網址 → 視為錯誤
function isFbInvalid(url) {
  const trimmed = String(url || '').trim();
  if (trimmed === '' || trimmed === '無') return false;
  return !isFacebookUrl(trimmed);
}

function signupHintClass(url) {
  const trimmed = String(url || '').trim();
  if (trimmed === '' || isSignupInvalid(trimmed)) return 'signup-hint-warn';
  return '';
}

// 報名截止日不可早於開始日
function isSignupDateRangeInvalid(item) {
  if (!item.signup_start || !item.signup_end) return false;
  return item.signup_end < item.signup_start;
}

function addItem() {
  items.value.push({
    date: '', title: '', facebook_url: '',
    signup_url: '', signup_start: '', signup_end: '',
    signup_closed: false, cancelled: false, description: '',
  });
}

function removeItem(idx) {
  if (!confirm(`確定刪除第 ${idx + 1} 筆行程「${items.value[idx].title || '（未命名）'}」？`)) return;
  items.value.splice(idx, 1);
}

async function saveSchedule() {
  const sem = semester.value.trim();
  if (!sem) return;

  // 儲存前驗證連結格式，有錯就擋下並提示是第幾筆
  const badSignup = items.value.findIndex(i => isSignupInvalid(i.signup_url));
  if (badSignup !== -1) {
    setStatus(`第 ${badSignup + 1} 筆的報名表單連結不是有效的 Google 表單，請修正後再儲存`, false);
    return;
  }
  const badFb = items.value.findIndex(i => isFbInvalid(i.facebook_url));
  if (badFb !== -1) {
    setStatus(`第 ${badFb + 1} 筆的 FB 連結格式有誤，請修正或填「無」後再儲存`, false);
    return;
  }
  const badDate = items.value.findIndex(i => isSignupDateRangeInvalid(i));
  if (badDate !== -1) {
    setStatus(`第 ${badDate + 1} 筆的報名截止日期早於開始日期，請修正後再儲存`, false);
    return;
  }

  // 清理空欄位
  const cleanItems = items.value
    .filter(i => i.date?.trim() || i.title?.trim())
    .map(i => {
      const obj = {
        date: i.date?.trim() || '',
        title: i.title?.trim() || '',
        facebook_url: i.facebook_url?.trim() || '無',
      };
      if (i.signup_url?.trim()) {
        obj.signup_url = i.signup_url.trim();
        // 以下欄位只有在有報名連結時才有意義
        if (i.signup_start) obj.signup_start = i.signup_start;
        if (i.signup_end) obj.signup_end = i.signup_end;
        if (i.signup_closed) obj.signup_closed = true;
      }
      // 倒隊與報名連結無關，獨立儲存
      if (i.cancelled) obj.cancelled = true;
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
.field-row input.input-warn { border-color: #e0a106; background: #fffdf5; }

.date-hint { font-size: 0.75rem; color: #999; }
.date-hint-warn { color: #b9770a; font-weight: 600; }

.signup-hint { font-size: 0.75rem; color: #2e7d52; }
.signup-hint-warn { color: #b9770a; font-weight: 600; }

.signup-dates {
  display: flex; gap: 14px; margin-top: 8px; flex-wrap: wrap;
}
.signup-date-field {
  display: flex; flex-direction: column; gap: 4px;
  font-size: 0.78rem; color: #666; font-weight: 600;
}
.signup-date-field input {
  padding: 7px 10px; border: 1px solid #ddd; border-radius: 7px;
  font-size: 0.9rem; font-family: inherit;
}
.signup-date-field input:focus { outline: none; border-color: #1A432D; }

.signup-closed-toggle {
  display: flex; align-items: center; gap: 7px;
  margin-top: 8px; font-size: 0.8rem; color: #555;
  font-weight: 500; cursor: pointer; user-select: none;
}
.signup-closed-toggle input { width: 15px; height: 15px; cursor: pointer; accent-color: #b5524a; }

.cancelled-toggle { color: #444; }
.cancelled-toggle input { accent-color: #888; }

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
