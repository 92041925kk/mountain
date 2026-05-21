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
                <span class="tag" :class="trip.status === 'draft' ? 'tag-draft' : 'tag-published'">
                  {{ trip.status === 'draft' ? '草稿' : '已發布' }}
                </span>
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
        <div class="draft-bar" v-if="draftStatus">
          <span>{{ draftStatus }}</span>
          <button class="btn-link" type="button" @click="clearTripDraft">清除本機草稿</button>
        </div>

        <div class="form-grid">
          <div class="field-row">
            <label>行程 ID <span class="required">*</span></label>
            <div class="id-row">
              <input
                :value="form.id"
                placeholder="系統會自動產生"
                :disabled="!!editingId"
                @input="onTripIdInput"
              />
              <button
                v-if="!editingId"
                class="btn-secondary"
                type="button"
                @click="regenerateTripId"
              >
                自動產生
              </button>
            </div>
            <span class="field-hint">新增時會自動產生；建立後不可更改。</span>
          </div>
          <div class="field-row">
            <label>行程名稱 <span class="required">*</span></label>
            <input :value="form.title" placeholder="例：老梅溪溯溪 - 梅好溯光" @input="onTripTitleInput" />
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
          <div class="field-row">
            <label>發布狀態</label>
            <select v-model="form.status">
              <option value="draft">草稿，不顯示在前台</option>
              <option value="published">發布，顯示在前台</option>
            </select>
            <span class="field-hint">新增行程預設為草稿，確認內容後再發布。</span>
          </div>
          <div class="field-row full-width">
            <label>封面圖片 URL</label>
            <input v-model="form.coverImage" placeholder="https://..." />
            <div class="cover-manager">
              <img
                v-if="coverPreviewSrc"
                :src="coverPreviewSrc"
                class="cover-preview"
                alt="封面預覽"
                @error="markCoverPreviewBroken"
              />
              <div class="cover-info">
                <div class="cover-upload">
                  <input ref="coverFileInputRef" type="file" accept="image/*" @change="onCoverFileChange" />
                  <button
                    class="btn-secondary"
                    type="button"
                    @click="uploadCoverImage"
                    :disabled="!editingId || !coverFile || isUploadingCover"
                  >
                    {{ isUploadingCover ? '上傳中...' : '上傳封面到 Storage' }}
                  </button>
                  <button
                    class="btn-secondary"
                    type="button"
                    @click="clearSelectedCoverFile"
                    :disabled="!coverFile || isUploadingCover"
                  >
                    清除選取
                  </button>
                  <button
                    class="btn-del"
                    type="button"
                    @click="removeCoverImage"
                    :disabled="(!form.coverImage && !coverFile) || isUploadingCover"
                  >
                    移除封面
                  </button>
                </div>
                <span class="field-hint" v-if="coverFile">
                  已選取：{{ coverFile.name }}；{{ editingId ? '可立即上傳。' : '建立行程時會自動上傳。' }}
                </span>
                <span class="field-hint" v-else>可貼上圖片 URL，或選擇圖片檔上傳到 Storage。</span>
                <span class="field-hint hint-err" v-if="coverPreviewBroken">封面圖片無法載入，請檢查 URL 或重新選擇圖片。</span>
                <span class="field-hint" v-if="coverStatus" :class="coverStatusClass">{{ coverStatus }}</span>
              </div>
            </div>
            <span class="field-hint hint-err" v-if="coverValidationError">{{ coverValidationError }}</span>
          </div>
          <div class="field-row full-width">
            <label>SEO / 分享文字</label>
            <textarea
              v-model="form.summary"
              rows="3"
              maxlength="160"
              placeholder="可留空；留空時會自動用學期、天數、難度與行程節點產生摘要。"
            ></textarea>
            <span class="field-hint">{{ form.summary ? `${form.summary.length}/160` : '分享到 LINE、Facebook 時會優先使用這段描述。' }}</span>
          </div>
          <div class="field-row full-width">
            <label>天氣資訊</label>
            <div class="weather-editor">
              <div class="weather-grid">
                <div class="field-row">
                  <label>天氣摘要</label>
                  <input v-model="form.weather.summary" placeholder="例：多雲午後短暫陣雨" />
                </div>
                <div class="field-row">
                  <label>溫度</label>
                  <input v-model="form.weather.temperature" placeholder="例：18-24°C" />
                </div>
                <div class="field-row">
                  <label>降雨機率 / 雨況</label>
                  <input v-model="form.weather.rainChance" placeholder="例：40%，溪谷水量穩定" />
                </div>
                <div class="field-row">
                  <label>風況</label>
                  <input v-model="form.weather.wind" placeholder="例：稜線風偏強" />
                </div>
                <div class="field-row">
                  <label>資料來源</label>
                  <input v-model="form.weather.source" placeholder="例：中央氣象署、領隊紀錄" />
                </div>
                <div class="field-row">
                  <label>更新日期</label>
                  <input v-model="form.weather.updatedAt" placeholder="例：2026-05-04" />
                </div>
                <div class="field-row full-width">
                  <label>補充說明</label>
                  <textarea v-model="form.weather.note" rows="3" placeholder="例：出發前一週留意午後雷陣雨，實際行程中午後雲量增加。"></textarea>
                </div>
              </div>
            </div>
          </div>
          <div class="field-row full-width">
            <label>活動記錄紙 PDF</label>
            <div class="record-import-box">
              <div class="record-upload-row">
                <input
                  ref="recordFileInputRef"
                  type="file"
                  accept="application/pdf,.pdf"
                  @change="onActivityRecordFileChange"
                  :disabled="isParsingRecord"
                />
                <button
                  v-if="activityRecordPreview"
                  class="btn-secondary"
                  type="button"
                  @click="clearActivityRecordImport"
                  :disabled="isParsingRecord"
                >
                  清除匯入
                </button>
              </div>
              <span class="field-hint">上傳活動記錄紙後，系統會自動轉成下方表格；套用前可調整每天的輕裝或重裝。</span>
              <p class="status-msg record-status" v-if="activityRecordStatus" :class="activityRecordStatusClass">
                {{ activityRecordStatus }}
              </p>

              <div class="record-preview" v-if="activityRecordPreview">
                <div class="record-summary">
                  <strong>{{ activityRecordPreview.activityName || '未辨識活動名稱' }}</strong>
                  <span v-if="activityRecordPreview.dateRange">{{ activityRecordPreview.dateRange }}</span>
                  <span>{{ activityRecordPreview.itemCount }} 筆紀錄</span>
                </div>

                <ul class="record-warnings" v-if="activityRecordPreview.warnings.length">
                  <li v-for="warning in activityRecordPreview.warnings" :key="warning">{{ warning }}</li>
                </ul>

                <div class="record-days">
                  <div class="record-day" v-for="(day, dayIndex) in activityRecordPreview.plan" :key="day.dayLabel">
                    <div class="record-day-header">
                      <strong>{{ day.dayLabel }}</strong>
                      <label>
                        行走類型
                        <select
                          v-model="activityRecordDayTypes[dayIndex]"
                          @change="setActivityRecordDayType(dayIndex, activityRecordDayTypes[dayIndex])"
                        >
                          <option value="heavy">重裝</option>
                          <option value="light">輕裝</option>
                        </select>
                      </label>
                    </div>
                    <ul class="record-items">
                      <li v-for="item in day.items.slice(0, 5)" :key="`${day.dayLabel}-${item.time}-${item.location}`">
                        <span class="record-time">{{ item.time }}</span>
                        <span class="record-place">{{ item.location }}</span>
                        <span class="record-type" :class="`record-type-${item.type}`">{{ movementTypeLabel(item.type) }}</span>
                      </li>
                      <li v-if="day.items.length > 5" class="record-more">還有 {{ day.items.length - 5 }} 筆...</li>
                    </ul>
                  </div>
                </div>

                <div class="record-actions">
                  <button class="btn-primary" type="button" @click="applyActivityRecordToForm">
                    套用到行程計畫
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="field-row full-width">
            <label>行程計畫 <span class="required">*</span></label>
            <div class="plan-editor">
              <div class="plan-toolbar">
                <span>{{ planSummary }}</span>
                <button class="btn-secondary" type="button" @click="addPlanDay">新增一天</button>
              </div>

              <div v-for="(day, dayIndex) in planDays" :key="dayIndex" class="plan-day-editor">
                <div class="plan-day-header">
                  <input v-model="day.dayLabel" aria-label="日期標籤" placeholder="例：D1 (9/24)" />
                  <div class="plan-day-actions">
                    <button class="btn-secondary" type="button" @click="movePlanDay(dayIndex, -1)" :disabled="dayIndex === 0">上移</button>
                    <button class="btn-secondary" type="button" @click="movePlanDay(dayIndex, 1)" :disabled="dayIndex === planDays.length - 1">下移</button>
                    <button class="btn-secondary" type="button" @click="addPlanItem(dayIndex)">新增節點</button>
                    <button class="btn-del" type="button" @click="removePlanDay(dayIndex)" :disabled="planDays.length === 1">刪除這天</button>
                  </div>
                </div>

                <div class="plan-table">
                  <div class="plan-table-head">
                    <span class="drag-column-label">排序</span>
                    <span>時間</span>
                    <span>地點</span>
                    <span>備註</span>
                    <span>類型</span>
                    <span>操作</span>
                  </div>
                  <div
                    v-for="(item, itemIndex) in day.items"
                    :key="getPlanItemKey(item)"
                    class="plan-row"
                    :class="{ 'is-dragging': isDraggingPlanItem(dayIndex, itemIndex) }"
                    :data-day-index="dayIndex"
                    :data-item-index="itemIndex"
                  >
                    <button
                      class="drag-handle"
                      type="button"
                      aria-label="長按拖曳排序"
                      title="長按拖曳排序"
                      @pointerdown="startPlanItemDragPress($event, dayIndex, itemIndex)"
                      @pointermove="updatePlanItemDrag($event)"
                      @pointerup="endPlanItemDragPress($event)"
                      @pointercancel="cancelPlanItemDrag($event)"
                      @dragstart.prevent
                    >
                      ⋮⋮
                    </button>
                    <input v-model="item.time" placeholder="08:40" />
                    <input v-model="item.location" placeholder="集合地點" />
                    <input v-model="item.info" placeholder="說明，可留空" />
                    <select v-model="item.type">
                      <option value="ride">搭車</option>
                      <option value="heavy">重裝</option>
                      <option value="light">輕裝</option>
                    </select>
                    <div class="row-actions">
                      <button class="btn-icon" type="button" @click="movePlanItem(dayIndex, itemIndex, -1)" :disabled="itemIndex === 0" title="上移">↑</button>
                      <button class="btn-icon" type="button" @click="movePlanItem(dayIndex, itemIndex, 1)" :disabled="itemIndex === day.items.length - 1" title="下移">↓</button>
                      <button class="btn-del compact" type="button" @click="removePlanItem(dayIndex, itemIndex)" :disabled="day.items.length === 1">刪除</button>
                    </div>
                  </div>
                </div>
              </div>

              <span class="field-hint json-hint" :class="jsonValid ? 'hint-ok' : 'hint-err'">
                {{ jsonValid ? '行程格式可儲存' : planError }}
              </span>

              <details class="json-details">
                <summary>進階：查看 JSON</summary>
                <textarea
                  :value="planJson"
                  rows="12"
                  spellcheck="false"
                  class="json-editor"
                  readonly
                  placeholder='[{"dayLabel":"D1 (9/24)","items":[{"time":"08:40","location":"集合地點","info":"說明","type":"light"}]}]'
                ></textarea>
              </details>
            </div>
          </div>
        </div>

        <p class="status-msg" v-if="formStatus" :class="formStatusClass">{{ formStatus }}</p>
        <ul class="validation-list" v-if="validationErrors.length">
          <li v-for="error in validationErrors" :key="error">{{ error }}</li>
        </ul>

        <div class="form-actions">
          <button class="btn-secondary" @click="closeForm">取消</button>
          <button class="btn-draft" @click="saveTrip('draft')" :disabled="!canSave">
            {{ isSaving && form.status === 'draft' ? '建立草稿中...' : '建立草稿' }}
          </button>
          <button class="btn-primary" @click="saveTrip('published')" :disabled="!canSave">
            {{ isSaving && form.status === 'published' ? '發布中...' : '發布' }}
          </button>
        </div>
      </section>

    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { collection, getDoc, getDocs, setDoc, deleteDoc, doc, orderBy, query, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import AdminHeader from '../../components/admin/AdminHeader.vue';
import { uploadImageFile } from '../../utils/imageUpload';
import { extractActivityRecordFromPdf } from '../../utils/activityRecordPdf';
import { applyMovementTypeToDay } from '../../utils/activityRecordParser';

const trips = ref([]);
const isFetching = ref(false);
const isSaving = ref(false);
const showForm = ref(false);
const editingId = ref(null);
const formStatus = ref('');
const formStatusClass = ref('');
const coverFile = ref(null);
const coverStatus = ref('');
const coverStatusClass = ref('');
const isUploadingCover = ref(false);
const coverFileInputRef = ref(null);
const coverLocalPreviewUrl = ref('');
const coverPreviewBroken = ref(false);
const recordFileInputRef = ref(null);
const activityRecordPreview = ref(null);
const activityRecordDayTypes = ref([]);
const activityRecordStatus = ref('');
const activityRecordStatusClass = ref('');
const isParsingRecord = ref(false);
const isAutoTripId = ref(true);

const form = ref(createEmptyTripForm());
const planDays = ref(createDefaultPlan());
const planJsonError = ref('');
const dragState = ref(null);
const draftStatus = ref('');
const currentDraftKey = ref('');
const isRestoringDraft = ref(false);

let planDragTimer = null;
let draftSaveTimer = null;
let planItemKeyCounter = 0;
const planItemKeys = new WeakMap();
const PLAN_DRAG_DELAY = 280;
const DRAFT_STORAGE_PREFIX = 'cymc-admin-trip-draft:';
const DRAFT_SAVE_DELAY = 700;
const MAX_COVER_FILE_SIZE = 10 * 1024 * 1024;

const jsonValid = computed(() => {
  return !planJsonError.value && !getPlanValidationError();
});

const planError = computed(() => planJsonError.value || getPlanValidationError() || '');

const coverPreviewSrc = computed(() => coverLocalPreviewUrl.value || form.value.coverImage || '');

const coverValidationError = computed(() => {
  if (!form.value.coverImage?.trim()) return '';
  return isValidImageUrl(form.value.coverImage)
    ? ''
    : '封面圖片 URL 必須是 http(s) 網址或站內 / 開頭路徑';
});

const validationErrors = computed(() => getTripValidationErrors());

const canSave = computed(() => !isSaving.value && !isUploadingCover.value && validationErrors.value.length === 0);

const planSummary = computed(() => {
  const itemCount = planDays.value.reduce((sum, day) => sum + (day.items?.length || 0), 0);
  return `${planDays.value.length} 天，${itemCount} 個節點`;
});

const planJson = computed({
  get() {
    return JSON.stringify(normalizePlan(planDays.value), null, 2);
  },
  set(value) {
    try {
      const parsed = JSON.parse(value);
      planDays.value = normalizePlan(parsed);
      planJsonError.value = '';
    } catch (e) {
      planJsonError.value = 'JSON 格式錯誤：' + e.message;
    }
  },
});

watch(planDays, () => {
  planJsonError.value = '';
}, { deep: true });

watch([form, planDays], () => {
  scheduleTripDraftSave();
}, { deep: true });

watch(() => form.value.coverImage, () => {
  coverPreviewBroken.value = false;
});

async function loadTrips() {
  isFetching.value = true;
  try {
    const tripsQuery = query(collection(db, 'trip'), orderBy('semester', 'desc'));
    const snap = await getDocs(tripsQuery);
    trips.value = snap.docs.map(d => ({ ...d.data(), id: d.id }));
  } finally {
    isFetching.value = false;
  }
}

function createEmptyTripForm() {
  return {
    id: '',
    title: '',
    semester: '',
    days: '',
    difficulty: '',
    status: 'draft',
    coverImage: '',
    coverStoragePath: '',
    summary: '',
    weather: createEmptyWeatherForm(),
  };
}

function createEmptyWeatherForm() {
  return {
    summary: '',
    temperature: '',
    rainChance: '',
    wind: '',
    source: '',
    updatedAt: '',
    note: '',
  };
}

function createDefaultPlan() {
  return [
    {
      dayLabel: 'D1 (日期)',
      items: [
        createPlanItem({ time: '09:00', location: '集合地點', info: '說明', type: 'light' }),
      ],
    },
  ];
}

function createPlanItem(item = {}) {
  return {
    time: item.time || '',
    location: item.location || '',
    info: item.info || '',
    type: ['ride', 'heavy', 'light'].includes(item.type) ? item.type : 'light',
  };
}

function normalizePlan(rawPlan) {
  if (!Array.isArray(rawPlan) || rawPlan.length === 0) return createDefaultPlan();

  return rawPlan.map((day, dayIndex) => {
    const items = Array.isArray(day?.items) && day.items.length
      ? day.items.map(createPlanItem)
      : [createPlanItem()];

    return {
      dayLabel: day?.dayLabel || `D${dayIndex + 1}`,
      items,
    };
  });
}

function setPlanFromRaw(rawPlan) {
  planDays.value = normalizePlan(rawPlan);
  planJsonError.value = '';
}

function getPlanValidationError() {
  const errors = getPlanValidationErrors();
  return errors[0] || '';
}

function getPlanValidationErrors() {
  const errors = [];
  if (!planDays.value.length) return ['至少需要一天行程'];

  const dayLabels = new Set();
  for (const [dayIndex, day] of planDays.value.entries()) {
    const dayLabel = day.dayLabel?.trim();
    const displayDay = dayLabel || `第 ${dayIndex + 1} 天`;

    if (!dayLabel) errors.push(`第 ${dayIndex + 1} 天缺少日期標籤`);
    if (dayLabel && dayLabels.has(dayLabel)) errors.push(`日期標籤「${dayLabel}」重複`);
    if (dayLabel) dayLabels.add(dayLabel);
    if (!day.items?.length) errors.push(`${displayDay} 至少需要一個節點`);

    const nodeKeys = new Set();
    for (const [itemIndex, item] of day.items.entries()) {
      const time = item.time?.trim();
      const location = item.location?.trim();
      const nodeLabel = `${displayDay} 第 ${itemIndex + 1} 筆`;

      if (!time) errors.push(`${nodeLabel} 缺少時間`);
      else if (!isValidPlanTime(time)) errors.push(`${nodeLabel} 時間格式需為 HH:mm，例如 08:40`);

      if (!location) errors.push(`${nodeLabel} 缺少地點`);

      if (!['ride', 'heavy', 'light'].includes(item.type)) {
        errors.push(`${nodeLabel} 的類型不正確`);
      }

      const nodeKey = `${time}|${location}`.toLowerCase();
      if (time && location && nodeKeys.has(nodeKey)) {
        errors.push(`${displayDay} 有重複節點：${time} ${location}`);
      }
      if (time && location) nodeKeys.add(nodeKey);
    }
  }

  return errors;
}

function getTripValidationErrors() {
  const errors = [];

  if (!form.value.title.trim()) errors.push('行程名稱為必填');
  if (!['draft', 'published'].includes(form.value.status)) errors.push('發布狀態不正確');
  if (!editingId.value && form.value.id.trim() && !normalizeTripId(form.value.id)) {
    errors.push('行程 ID 格式不正確');
  }
  if (coverValidationError.value) errors.push(coverValidationError.value);
  if (coverPreviewBroken.value) errors.push('封面圖片目前無法載入');
  if (form.value.summary && form.value.summary.length > 160) errors.push('SEO / 分享文字需在 160 字以內');
  if (form.value.weather.updatedAt?.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(form.value.weather.updatedAt.trim())) {
    errors.push('天氣更新日期需為 YYYY-MM-DD');
  }

  return [...errors, ...getPlanValidationErrors()];
}

function isValidPlanTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function isValidImageUrl(value) {
  const url = value.trim();
  if (!url) return true;
  if (url.startsWith('/')) return true;

  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function addPlanDay() {
  planDays.value.push({
    dayLabel: `D${planDays.value.length + 1} (日期)`,
    items: [createPlanItem()],
  });
  planJsonError.value = '';
}

function removePlanDay(dayIndex) {
  if (planDays.value.length === 1) return;
  planDays.value.splice(dayIndex, 1);
  planJsonError.value = '';
}

function movePlanDay(dayIndex, direction) {
  moveArrayItem(planDays.value, dayIndex, dayIndex + direction);
  planJsonError.value = '';
}

function addPlanItem(dayIndex) {
  planDays.value[dayIndex]?.items.push(createPlanItem());
  planJsonError.value = '';
}

function removePlanItem(dayIndex, itemIndex) {
  const items = planDays.value[dayIndex]?.items;
  if (!items || items.length === 1) return;
  items.splice(itemIndex, 1);
  planJsonError.value = '';
}

function movePlanItem(dayIndex, itemIndex, direction) {
  const items = planDays.value[dayIndex]?.items;
  if (!items) return;
  moveArrayItem(items, itemIndex, itemIndex + direction);
  planJsonError.value = '';
}

function getPlanItemKey(item) {
  if (!planItemKeys.has(item)) {
    planItemKeyCounter += 1;
    planItemKeys.set(item, `plan-item-${planItemKeyCounter}`);
  }
  return planItemKeys.get(item);
}

function startPlanItemDragPress(event, dayIndex, itemIndex) {
  if (event.button !== undefined && event.button !== 0) return;

  clearPlanDragTimer();
  event.currentTarget.setPointerCapture?.(event.pointerId);

  dragState.value = {
    dayIndex,
    itemIndex,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    isDragging: false,
    handle: event.currentTarget,
  };

  planDragTimer = window.setTimeout(() => {
    if (!dragState.value || dragState.value.pointerId !== event.pointerId) return;
    dragState.value = { ...dragState.value, isDragging: true };
    document.body.classList.add('plan-item-dragging');
  }, PLAN_DRAG_DELAY);
}

function updatePlanItemDrag(event) {
  const state = dragState.value;
  if (!state || state.pointerId !== event.pointerId) return;

  if (!state.isDragging) {
    const moved = Math.hypot(event.clientX - state.startX, event.clientY - state.startY);
    if (moved > 8) cancelPlanItemDrag(event);
    return;
  }

  event.preventDefault();

  const targetRow = document
    .elementFromPoint(event.clientX, event.clientY)
    ?.closest?.('[data-day-index][data-item-index]');

  if (!targetRow) return;

  const targetDayIndex = Number(targetRow.dataset.dayIndex);
  const targetItemIndex = Number(targetRow.dataset.itemIndex);
  if (targetDayIndex !== state.dayIndex || Number.isNaN(targetItemIndex)) return;
  if (targetItemIndex === state.itemIndex) return;

  const items = planDays.value[state.dayIndex]?.items;
  if (!items) return;

  moveArrayItem(items, state.itemIndex, targetItemIndex);
  planJsonError.value = '';
  dragState.value = { ...state, itemIndex: targetItemIndex };
}

function endPlanItemDragPress(event) {
  const state = dragState.value;
  if (state && event.pointerId !== state.pointerId) return;
  finishPlanItemDrag();
}

function cancelPlanItemDrag(event) {
  const state = dragState.value;
  if (state && event?.pointerId !== undefined && event.pointerId !== state.pointerId) return;
  finishPlanItemDrag();
}

function finishPlanItemDrag() {
  clearPlanDragTimer();

  const state = dragState.value;
  state?.handle?.releasePointerCapture?.(state.pointerId);
  dragState.value = null;

  if (typeof document !== 'undefined') {
    document.body.classList.remove('plan-item-dragging');
  }
}

function clearPlanDragTimer() {
  if (!planDragTimer) return;
  window.clearTimeout(planDragTimer);
  planDragTimer = null;
}

function isDraggingPlanItem(dayIndex, itemIndex) {
  return dragState.value?.isDragging
    && dragState.value.dayIndex === dayIndex
    && dragState.value.itemIndex === itemIndex;
}

function moveArrayItem(items, fromIndex, toIndex) {
  if (toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) return;
  const [item] = items.splice(fromIndex, 1);
  items.splice(toIndex, 0, item);
}

function openForm(trip) {
  if (trip) {
    editingId.value = trip.id;
    isAutoTripId.value = false;
    form.value = {
      id: trip.id || '',
      title: trip.title || '',
      semester: trip.semester || '',
      days: trip.days || '',
      difficulty: trip.difficulty || '',
      status: trip.status || 'published',
      coverImage: trip.coverImage || '',
      coverStoragePath: trip.coverStoragePath || '',
      summary: trip.summary || '',
      weather: { ...createEmptyWeatherForm(), ...(trip.weather || {}) },
    };
    setPlanFromRaw(trip.plan || []);
  } else {
    editingId.value = null;
    isAutoTripId.value = true;
    form.value = createEmptyTripForm();
    setPlanFromRaw(createDefaultPlan());
  }
  currentDraftKey.value = getTripDraftKey(editingId.value || 'new');
  restoreTripDraft();
  clearSelectedCoverFile();
  coverStatus.value = '';
  coverPreviewBroken.value = false;
  clearActivityRecordImport();
  showForm.value = true;
  formStatus.value = '';
  setTimeout(() => document.querySelector('.admin-section:last-child')?.scrollIntoView({ behavior: 'smooth' }), 100);
}

function closeForm() {
  showForm.value = false;
  editingId.value = null;
  isAutoTripId.value = true;
  clearActivityRecordImport();
  clearDraftTimer();
  clearSelectedCoverFile();
}

function setStatus(msg, ok = true) {
  formStatus.value = msg;
  formStatusClass.value = ok ? 'status-ok' : 'status-err';
  if (ok) setTimeout(() => { formStatus.value = ''; }, 3000);
}

async function saveTrip(status) {
  form.value.status = status;

  if (validationErrors.value.length) {
    setStatus(validationErrors.value[0], false);
    return;
  }

  isSaving.value = true;
  try {
    if (!editingId.value) {
      if (!form.value.id.trim() || isAutoTripId.value) {
        form.value.id = await generateUniqueTripId();
      } else {
        form.value.id = normalizeTripId(form.value.id);
        if (!form.value.id) {
          form.value.id = await generateUniqueTripId();
        }
      }

      const existingTrip = await getDoc(doc(db, 'trip', form.value.id));
      if (existingTrip.exists()) {
        setStatus(`行程 ID「${form.value.id}」已存在，請按「自動產生」換一個`, false);
        return;
      }
    }

    const plan = normalizePlan(planDays.value);
    const data = {
      ...form.value,
      id: form.value.id.trim(),
      title: form.value.title.trim(),
      semester: form.value.semester.trim(),
      days: form.value.days.trim(),
      difficulty: form.value.difficulty.trim(),
      coverImage: form.value.coverImage.trim(),
      coverStoragePath: form.value.coverStoragePath.trim(),
      summary: form.value.summary.trim(),
      plan,
      weather: normalizeWeather(form.value.weather),
    };

    if (coverFile.value) {
      const uploaded = await uploadSelectedCoverFile(data.id.trim());
      data.coverImage = uploaded.url;
      data.coverStoragePath = uploaded.storagePath;
      form.value.coverImage = uploaded.url;
      form.value.coverStoragePath = uploaded.storagePath;
    }

    if (!data.coverImage) delete data.coverImage;
    if (!data.coverStoragePath) delete data.coverStoragePath;
    if (!data.summary?.trim()) delete data.summary;
    if (!data.weather) delete data.weather;
    await setDoc(doc(db, 'trip', data.id), data);
    setStatus('✅ 儲存成功！');
    clearTripDraft({ silent: true });
    await loadTrips();
    closeForm();
  } catch (e) {
    setStatus('儲存失敗：' + e.message, false);
  } finally {
    isSaving.value = false;
  }
}

function normalizeWeather(weather) {
  const clean = Object.fromEntries(
    Object.entries({ ...createEmptyWeatherForm(), ...(weather || {}) })
      .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
  );

  return Object.values(clean).some(Boolean) ? clean : null;
}

function onCoverFileChange(e) {
  const file = e.target.files?.[0] || null;
  coverStatus.value = '';
  coverStatusClass.value = '';
  coverPreviewBroken.value = false;
  revokeCoverPreviewUrl();

  if (!file) {
    coverFile.value = null;
    return;
  }

  if (!file.type.startsWith('image/')) {
    coverFile.value = null;
    coverStatus.value = '請選擇圖片檔';
    coverStatusClass.value = 'status-err';
    if (coverFileInputRef.value) coverFileInputRef.value.value = '';
    return;
  }

  if (file.size > MAX_COVER_FILE_SIZE) {
    coverFile.value = null;
    coverStatus.value = '圖片檔需小於 10MB';
    coverStatusClass.value = 'status-err';
    if (coverFileInputRef.value) coverFileInputRef.value.value = '';
    return;
  }

  coverFile.value = file;
  coverLocalPreviewUrl.value = URL.createObjectURL(file);
}

async function uploadCoverImage() {
  if (!editingId.value || !coverFile.value) return;

  isUploadingCover.value = true;
  coverStatus.value = '';
  try {
    const uploaded = await uploadSelectedCoverFile(editingId.value);
    await updateDoc(doc(db, 'trip', editingId.value), {
      coverImage: uploaded.url,
      coverStoragePath: uploaded.storagePath,
    });

    coverStatus.value = '✅ 封面已上傳並更新';
    coverStatusClass.value = 'status-ok';
    clearSelectedCoverFile();
    await loadTrips();
  } catch (e) {
    coverStatus.value = '封面上傳失敗：' + e.message;
    coverStatusClass.value = 'status-err';
  } finally {
    isUploadingCover.value = false;
  }
}

async function uploadSelectedCoverFile(tripId) {
  const uploaded = await uploadImageFile(coverFile.value, `trip-covers/${tripId}`, {
    maxWidth: 1800,
    quality: 0.86,
  });

  form.value.coverImage = uploaded.url;
  form.value.coverStoragePath = uploaded.storagePath;
  coverPreviewBroken.value = false;
  return uploaded;
}

async function removeCoverImage() {
  clearSelectedCoverFile();
  form.value.coverImage = '';
  form.value.coverStoragePath = '';
  coverPreviewBroken.value = false;

  if (!editingId.value) return;

  try {
    await updateDoc(doc(db, 'trip', editingId.value), {
      coverImage: '',
      coverStoragePath: '',
    });
    coverStatus.value = '已移除封面';
    coverStatusClass.value = 'status-ok';
    await loadTrips();
  } catch (e) {
    coverStatus.value = '移除封面失敗：' + e.message;
    coverStatusClass.value = 'status-err';
  }
}

function clearSelectedCoverFile() {
  coverFile.value = null;
  revokeCoverPreviewUrl();
  if (coverFileInputRef.value) coverFileInputRef.value.value = '';
}

function revokeCoverPreviewUrl() {
  if (!coverLocalPreviewUrl.value) return;
  URL.revokeObjectURL(coverLocalPreviewUrl.value);
  coverLocalPreviewUrl.value = '';
}

function markCoverPreviewBroken() {
  if (coverLocalPreviewUrl.value) return;
  coverPreviewBroken.value = true;
}

async function onActivityRecordFileChange(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  isParsingRecord.value = true;
  activityRecordStatus.value = '正在解析活動記錄紙...';
  activityRecordStatusClass.value = 'status-ok';

  try {
    const parsed = await extractActivityRecordFromPdf(file);
    if (!parsed.plan.length) {
      throw new Error('沒有辨識到可套用的行程紀錄');
    }

    activityRecordPreview.value = parsed;
    activityRecordDayTypes.value = parsed.dayTypes.map((type) => (type === 'light' ? 'light' : 'heavy'));
    activityRecordStatus.value = `已解析 ${parsed.plan.length} 天、${parsed.itemCount} 筆紀錄`;
    activityRecordStatusClass.value = parsed.warnings.length ? 'status-err' : 'status-ok';
  } catch (e) {
    activityRecordPreview.value = null;
    activityRecordDayTypes.value = [];
    activityRecordStatus.value = '解析失敗：' + e.message;
    activityRecordStatusClass.value = 'status-err';
  } finally {
    isParsingRecord.value = false;
  }
}

function setActivityRecordDayType(dayIndex, movementType) {
  if (!activityRecordPreview.value?.plan?.[dayIndex]) return;

  activityRecordPreview.value.plan[dayIndex] = applyMovementTypeToDay(
    activityRecordPreview.value.plan[dayIndex],
    movementType
  );
}

function applyActivityRecordToForm() {
  if (!activityRecordPreview.value) return;

  setPlanFromRaw(activityRecordPreview.value.plan);
  if (!form.value.title.trim() && activityRecordPreview.value.activityName) {
    form.value.title = activityRecordPreview.value.activityName;
  }
  if (!form.value.days.trim() && activityRecordPreview.value.daysText) {
    form.value.days = activityRecordPreview.value.daysText;
  }
  syncAutoTripId();

  setStatus('✅ 已套用活動記錄紙內容，請確認後儲存');
}

function clearActivityRecordImport() {
  activityRecordPreview.value = null;
  activityRecordDayTypes.value = [];
  activityRecordStatus.value = '';
  activityRecordStatusClass.value = '';
  isParsingRecord.value = false;
  if (recordFileInputRef.value) recordFileInputRef.value.value = '';
}

function getTripDraftKey(id) {
  return `${DRAFT_STORAGE_PREFIX}${id || 'new'}`;
}

function scheduleTripDraftSave() {
  if (!showForm.value || isRestoringDraft.value || !currentDraftKey.value || !import.meta.client) return;

  clearDraftTimer();
  draftSaveTimer = window.setTimeout(() => {
    saveTripDraft();
  }, DRAFT_SAVE_DELAY);
}

function saveTripDraft() {
  if (!showForm.value || !currentDraftKey.value || !import.meta.client) return;

  const savedAt = new Date().toISOString();
  const payload = {
    savedAt,
    editingId: editingId.value,
    isAutoTripId: isAutoTripId.value,
    form: form.value,
    plan: normalizePlan(planDays.value),
  };

  try {
    localStorage.setItem(currentDraftKey.value, JSON.stringify(payload));
    draftStatus.value = `本機草稿已自動儲存：${formatDraftTime(savedAt)}`;
  } catch (e) {
    draftStatus.value = '本機草稿儲存失敗，請確認瀏覽器儲存空間';
  }
}

function restoreTripDraft() {
  if (!currentDraftKey.value || !import.meta.client) return;

  const rawDraft = localStorage.getItem(currentDraftKey.value);
  if (!rawDraft) {
    draftStatus.value = '';
    return;
  }

  try {
    const draft = JSON.parse(rawDraft);
    isRestoringDraft.value = true;
    form.value = {
      ...createEmptyTripForm(),
      ...(draft.form || {}),
      weather: {
        ...createEmptyWeatherForm(),
        ...(draft.form?.weather || {}),
      },
    };
    planDays.value = normalizePlan(draft.plan);
    isAutoTripId.value = Boolean(draft.isAutoTripId);
    planJsonError.value = '';
    draftStatus.value = `已還原本機草稿：${formatDraftTime(draft.savedAt)}`;
  } catch {
    draftStatus.value = '本機草稿讀取失敗，建議清除後重新編輯';
  } finally {
    isRestoringDraft.value = false;
  }
}

function clearTripDraft(options = {}) {
  clearDraftTimer();
  if (currentDraftKey.value && import.meta.client) {
    localStorage.removeItem(currentDraftKey.value);
  }
  if (!options.silent) draftStatus.value = '本機草稿已清除';
}

function clearDraftTimer() {
  if (!draftSaveTimer) return;
  window.clearTimeout(draftSaveTimer);
  draftSaveTimer = null;
}

function formatDraftTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function movementTypeLabel(type) {
  return {
    ride: '搭車',
    heavy: '重裝',
    light: '輕裝',
  }[type] || type;
}

function onTripIdInput(event) {
  if (editingId.value) return;
  isAutoTripId.value = false;
  form.value.id = normalizeTripId(event.target.value);
}

function onTripTitleInput(event) {
  form.value.title = event.target.value;
  syncAutoTripId();
}

function syncAutoTripId() {
  if (editingId.value || !isAutoTripId.value) return;
  form.value.id = createTripIdCandidate();
}

function regenerateTripId() {
  if (editingId.value) return;
  isAutoTripId.value = true;
  form.value.id = createTripIdCandidate();
}

async function generateUniqueTripId() {
  const baseId = createTripIdBase();
  let candidate = createLocallyUniqueTripId(baseId);
  let counter = 2;

  while ((await getDoc(doc(db, 'trip', candidate))).exists()) {
    candidate = `${baseId}-${counter}`;
    counter += 1;
  }

  return candidate;
}

function createTripIdCandidate() {
  return createLocallyUniqueTripId(createTripIdBase());
}

function createLocallyUniqueTripId(baseId) {
  const existingIds = new Set(trips.value.map((trip) => trip.id).filter(Boolean));
  if (!existingIds.has(baseId)) return baseId;

  let counter = 2;
  while (existingIds.has(`${baseId}-${counter}`)) counter += 1;
  return `${baseId}-${counter}`;
}

function createTripIdBase() {
  const title = form.value.title || activityRecordPreview.value?.activityName || '';
  const dateRange = activityRecordPreview.value?.dateRange || '';
  const slug = slugifyAscii(title);
  const dateSlug = formatDateRangeForId(dateRange);
  const hash = shortHash(`${title}|${dateRange}|${form.value.semester || ''}`);

  if (slug && /[a-z]/.test(slug) && slug !== 'trip') {
    return normalizeTripId(dateSlug ? `${slug}-${dateSlug}` : slug);
  }

  return normalizeTripId(`trip-${dateSlug || currentDateForId()}-${hash}`);
}

function slugifyAscii(text) {
  return String(text || '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 42);
}

function normalizeTripId(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 64);
}

function formatDateRangeForId(dateRange) {
  const dates = String(dateRange || '').match(/\d{1,2}\/\d{1,2}|\d{1,2}/g);
  if (!dates?.length) return '';

  const first = normalizeDatePartForId(dates[0]);
  const last = normalizeDatePartForId(dates[dates.length - 1], first.slice(0, 2));
  return first && last && first !== last ? `${first}-${last}` : first;
}

function normalizeDatePartForId(datePart, fallbackMonth = '') {
  const parts = String(datePart || '').split('/');
  if (parts.length === 2) {
    return `${parts[0].padStart(2, '0')}${parts[1].padStart(2, '0')}`;
  }
  if (parts.length === 1 && fallbackMonth) {
    return `${fallbackMonth}${parts[0].padStart(2, '0')}`;
  }
  return '';
}

function currentDateForId() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
}

function shortHash(text) {
  let hash = 0;
  const source = String(text || 'trip');
  for (let i = 0; i < source.length; i += 1) {
    hash = ((hash << 5) - hash + source.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36).padStart(4, '0').slice(0, 6);
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
onBeforeUnmount(() => {
  finishPlanItemDrag();
  clearDraftTimer();
  revokeCoverPreviewUrl();
});
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
.tag-draft { background: #f4eeee; color: #8a4a35; }
.tag-published { background: #e8f5ee; color: #2e7d52; }
.trip-actions { display: flex; gap: 8px; }

/* Form */
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
.form-grid .full-width { grid-column: 1 / -1; }
.draft-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #eef7f2;
  border: 1px solid #cfe5d7;
  border-radius: 8px;
  color: #1A432D;
  font-size: 0.86rem;
  font-weight: 700;
  margin: 0 0 18px;
  padding: 10px 12px;
}

.field-row { display: flex; flex-direction: column; gap: 5px; }
.field-row label { font-size: 0.82rem; color: #555; font-weight: 600; }
.id-row { display: flex; gap: 8px; align-items: center; }
.id-row input { flex: 1; min-width: 0; }
.id-row .btn-secondary { white-space: nowrap; padding-inline: 12px; }
.required { color: #c0392b; }
.field-row input, .field-row textarea, .field-row select {
  padding: 9px 12px; border: 1px solid #ddd; border-radius: 7px;
  font-size: 0.92rem; font-family: inherit;
}
.field-row input:focus, .field-row textarea:focus, .field-row select:focus { outline: none; border-color: #1A432D; }
.field-row input:disabled { background: #f5f5f5; color: #999; }
.field-hint { font-size: 0.78rem; color: #999; }
.hint-ok { color: #2e7d52; }
.hint-err { color: #c0392b; }
.json-editor { font-family: 'Consolas', 'Monaco', monospace; font-size: 0.85rem; line-height: 1.5; }
.cover-manager {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-top: 6px;
}
.cover-preview {
  width: 160px;
  height: 104px;
  object-fit: cover;
  border: 1px solid #e0e7e3;
  border-radius: 8px;
  background: #f2f5f3;
}
.cover-info {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}
.cover-upload { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.cover-upload input { padding: 0; border: none; }
.json-hint { font-weight: 600; margin-top: 4px; }

.weather-editor {
  border: 1px solid #dfe8e2;
  border-radius: 8px;
  padding: 14px;
  background: #f8faf9;
}

.weather-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}
.weather-grid .full-width {
  grid-column: 1 / -1;
}

.record-import-box {
  border: 1px solid #dfe8e2;
  border-radius: 8px;
  padding: 14px;
  background: #f8faf9;
}
.record-upload-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; }
.record-upload-row input { padding: 0; border: none; }
.record-status { margin: 8px 0 0; }
.record-preview {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.record-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  color: #1A432D;
}
.record-summary span {
  background: #e8f5ee;
  color: #2e7d52;
  border-radius: 999px;
  padding: 2px 10px;
  font-size: 0.78rem;
}
.record-warnings {
  margin: 0;
  padding-left: 18px;
  color: #c0392b;
  font-size: 0.85rem;
}
.record-days { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.record-day {
  background: white;
  border: 1px solid #e4ebe6;
  border-radius: 8px;
  padding: 12px;
}
.record-day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}
.record-day-header strong { color: #1A432D; }
.record-day-header label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  color: #666;
  white-space: nowrap;
}
.record-day-header select {
  border: 1px solid #d7e1dc;
  border-radius: 6px;
  padding: 4px 6px;
  font-family: inherit;
}
.record-items {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.record-items li {
  display: grid;
  grid-template-columns: 48px 1fr auto;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
}
.record-time { color: #1A432D; font-weight: 700; }
.record-place { color: #444; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.record-type {
  border-radius: 999px;
  padding: 1px 8px;
  font-size: 0.72rem;
  font-weight: 700;
}
.record-type-heavy { background: #e8f5ee; color: #1A432D; }
.record-type-light { background: #eef6ff; color: #1a5276; }
.record-type-ride { background: #fff3e0; color: #e65100; }
.record-more { color: #888; font-size: 0.78rem; }
.record-actions { display: flex; justify-content: flex-end; }

.plan-editor {
  border: 1px solid #dfe8e2;
  border-radius: 8px;
  padding: 14px;
  background: #f8faf9;
}
.plan-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.plan-toolbar span {
  color: #1A432D;
  font-size: 0.88rem;
  font-weight: 700;
}
.plan-day-editor {
  background: white;
  border: 1px solid #e3ebe6;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}
.plan-day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}
.plan-day-header input {
  max-width: 220px;
  font-weight: 700;
  color: #1A432D;
}
.plan-day-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.plan-table {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.plan-table-head,
.plan-row {
  display: grid;
  grid-template-columns: 34px 88px minmax(150px, 1fr) minmax(180px, 1.2fr) 96px 140px;
  gap: 8px;
  align-items: center;
}
.plan-table-head {
  color: #718077;
  font-size: 0.76rem;
  font-weight: 700;
}
.drag-column-label {
  text-align: center;
}
.plan-row {
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 2px;
  transition: background-color 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
}
.plan-row.is-dragging {
  background: #eef7f2;
  border-color: #9bc7ad;
  box-shadow: 0 8px 20px rgba(26, 67, 45, 0.14);
}
.plan-row input,
.plan-row select,
.plan-day-header input {
  width: 100%;
  box-sizing: border-box;
}
.drag-handle {
  width: 30px;
  height: 34px;
  border: 1px solid #d8e2dc;
  border-radius: 7px;
  background: white;
  color: #718077;
  cursor: grab;
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1;
  touch-action: none;
  user-select: none;
}
.drag-handle:active {
  cursor: grabbing;
  color: #1A432D;
  border-color: #9bc7ad;
  background: #f6fbf8;
}
.plan-row.is-dragging .drag-handle {
  cursor: grabbing;
  color: #1A432D;
  border-color: #7eb293;
}
:global(body.plan-item-dragging) {
  cursor: grabbing;
  user-select: none;
}
.btn-del.compact {
  padding: 7px 10px;
  font-size: 0.78rem;
}
.row-actions {
  display: flex;
  align-items: center;
  gap: 5px;
}
.btn-icon {
  width: 30px;
  height: 30px;
  border: 1px solid #d8e2dc;
  border-radius: 7px;
  background: white;
  color: #1A432D;
  cursor: pointer;
  font-weight: 700;
}
.btn-icon:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.btn-del:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.json-details {
  margin-top: 12px;
}
.json-details summary {
  color: #1A432D;
  cursor: pointer;
  font-size: 0.86rem;
  font-weight: 700;
  margin-bottom: 8px;
}
.json-details textarea {
  width: 100%;
  box-sizing: border-box;
}

.status-msg { font-size: 0.88rem; margin-bottom: 14px; }
.status-ok { color: #2e7d52; }
.status-err { color: #c0392b; }
.validation-list {
  margin: 0 0 14px;
  padding: 12px 14px 12px 30px;
  border: 1px solid #f4c8c8;
  border-radius: 8px;
  background: #fff7f7;
  color: #c0392b;
  font-size: 0.85rem;
  line-height: 1.6;
}

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
.btn-draft {
  background: #eef2f0; color: #1A432D; border: 1px solid #cbd8d0;
  padding: 9px 18px; border-radius: 8px; font-size: 0.9rem;
  font-weight: bold; cursor: pointer; transition: background 0.2s, border-color 0.2s;
}
.btn-draft:hover:not(:disabled) {
  background: #dde8e1;
  border-color: #aebfb5;
}
.btn-draft:disabled { opacity: 0.55; cursor: not-allowed; }
.btn-link {
  border: none;
  background: transparent;
  color: #1A432D;
  cursor: pointer;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0;
  text-decoration: underline;
}
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
  .weather-grid { grid-template-columns: 1fr; }
  .weather-grid .full-width { grid-column: 1; }
  .id-row { align-items: stretch; flex-direction: column; }
  .draft-bar,
  .cover-manager { align-items: stretch; flex-direction: column; }
  .cover-preview { width: 100%; height: auto; aspect-ratio: 16 / 10; }
  .plan-toolbar,
  .plan-day-header { align-items: stretch; flex-direction: column; }
  .plan-day-header input { max-width: none; }
  .plan-table-head { display: none; }
  .plan-row {
    grid-template-columns: 1fr;
    border: 1px solid #edf1ee;
    border-radius: 8px;
    padding: 10px;
    background: #fbfdfc;
  }
  .drag-handle {
    justify-self: start;
  }
  .trip-row { flex-direction: column; align-items: flex-start; gap: 10px; }
  .record-days { grid-template-columns: 1fr; }
  .record-items li { grid-template-columns: 48px 1fr; }
  .record-type { justify-self: start; grid-column: 2; }
}
</style>
