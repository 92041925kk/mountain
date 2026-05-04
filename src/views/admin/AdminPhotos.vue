<template>
  <div class="admin-page">
    <AdminHeader title="照片管理" />

    <main class="admin-main">

      <!-- 上傳區 -->
      <section class="admin-section">
        <h3>上傳新照片</h3>
        <div class="upload-area" @dragover.prevent @drop.prevent="onDrop">
          <p>拖放圖片到這裡，或</p>
          <input ref="fileInputRef" type="file" multiple accept="image/*" class="hidden-input" @change="onFileChange" />
          <button class="btn-pick" @click="fileInputRef.click()">選擇圖片</button>
          <span class="file-count" v-if="selectedFiles.length"> 已選 {{ selectedFiles.length }} 張</span>
        </div>

        <div class="upload-meta" v-if="selectedFiles.length">
          <div class="field-row">
            <label>說明文字（選填）</label>
            <input v-model="uploadCaption" placeholder="例：老梅溪溯溪" />
          </div>
          <div class="field-row">
            <label>行程 ID（選填）</label>
            <input v-model="uploadTripId" placeholder="例：laomei-creek-2026" />
          </div>
          <div class="field-row">
            <label>照片位置（選填）</label>
            <input v-model="uploadLocation" placeholder="例：老梅瀑布" />
          </div>
          <div class="field-row compact-field">
            <label>首頁精選</label>
            <label class="check-row">
              <input v-model="uploadHomeFeatured" type="checkbox" />
              顯示在首頁照片牆
            </label>
          </div>
          <div class="field-row compact-field" v-if="uploadHomeFeatured">
            <label>首頁排序</label>
            <input v-model.number="uploadHomeOrder" type="number" min="1" placeholder="數字越小越前面" />
          </div>
        </div>

        <div class="upload-actions" v-if="selectedFiles.length">
          <button class="btn-primary" @click="uploadFiles" :disabled="isUploading">
            {{ isUploading ? `壓縮上傳中... (${doneCount}/${selectedFiles.length})` : `上傳 ${selectedFiles.length} 張` }}
          </button>
          <button class="btn-secondary" @click="clearSelection" :disabled="isUploading">清除選取</button>
        </div>

        <div class="upload-log" v-if="uploadLog.length">
          <p v-for="(msg, i) in uploadLog" :key="i" :class="msg.ok ? 'log-ok' : 'log-err'">
            {{ msg.ok ? '✅' : '❌' }} {{ msg.text }}
          </p>
        </div>
      </section>

      <!-- 現有照片 -->
      <section class="admin-section">
        <div class="section-header">
          <h3>現有照片（{{ filteredPhotos.length }} / {{ photos.length }} 張）</h3>
          <button class="btn-secondary" @click="loadPhotos">重新整理</button>
        </div>

        <div class="photo-filters">
          <input v-model="searchQuery" placeholder="搜尋說明、行程 ID 或位置" />
          <select v-model="selectedTripFilter">
            <option value="all">全部行程</option>
            <option value="unlinked">未綁定行程</option>
            <option v-for="trip in trips" :key="trip.id" :value="trip.id">{{ trip.title || trip.id }}</option>
          </select>
          <select v-model="homeFilter">
            <option value="all">全部照片</option>
            <option value="featured">首頁精選</option>
            <option value="normal">非首頁精選</option>
          </select>
        </div>

        <div v-if="isFetching" class="hint">載入中...</div>
        <div v-else-if="photos.length === 0" class="hint">尚無照片</div>
        <div v-else-if="filteredPhotos.length === 0" class="hint">找不到符合條件的照片</div>
        <div v-else class="photos-grid">
          <div v-for="photo in filteredPhotos" :key="photo.docId" class="photo-card">
            <img :src="photo.url" :alt="photo.caption || '照片'" />
            <div class="photo-info">
              <template v-if="editingPhotoId === photo.docId">
                <div class="edit-grid">
                  <label>
                    說明
                    <input v-model="editForm.caption" />
                  </label>
                  <label>
                    行程 ID
                    <input v-model="editForm.tripId" list="trip-id-options" />
                  </label>
                  <label>
                    位置
                    <input v-model="editForm.location" />
                  </label>
                  <label class="check-row">
                    <input v-model="editForm.homeFeatured" type="checkbox" />
                    首頁精選
                  </label>
                  <label v-if="editForm.homeFeatured">
                    首頁排序
                    <input v-model.number="editForm.homeOrder" type="number" min="1" />
                  </label>
                </div>
                <div class="card-actions">
                  <button class="btn-secondary small" @click="cancelEdit">取消</button>
                  <button class="btn-primary small" @click="savePhotoEdits(photo)" :disabled="isSavingPhoto">
                    {{ isSavingPhoto ? '儲存中...' : '儲存' }}
                  </button>
                </div>
              </template>
              <template v-else>
                <p class="caption">{{ photo.caption || '（無說明）' }}</p>
                <p class="trip-id" v-if="photo.tripId">{{ photo.tripId }}</p>
                <p class="trip-id" v-if="photo.location">位置：{{ photo.location }}</p>
                <div class="photo-badges">
                  <span v-if="photo.homeFeatured">首頁精選</span>
                  <span v-if="photo.homeOrder">排序 {{ photo.homeOrder }}</span>
                </div>
                <div class="card-actions">
                  <button class="btn-secondary small" @click="openEditPhoto(photo)">編輯</button>
                  <button class="btn-del small" @click="confirmDelete(photo)">刪除</button>
                </div>
              </template>
            </div>
          </div>
        </div>

        <datalist id="trip-id-options">
          <option v-for="trip in trips" :key="trip.id" :value="trip.id">{{ trip.title }}</option>
        </datalist>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import {
  collection, addDoc, getDocs, deleteDoc, doc, updateDoc,
  serverTimestamp, query, orderBy
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../firebase';
import AdminHeader from '../../components/admin/AdminHeader.vue';

// ── 現有照片 ──
const photos = ref([]);
const trips = ref([]);
const isFetching = ref(false);
const searchQuery = ref('');
const selectedTripFilter = ref('all');
const homeFilter = ref('all');
const editingPhotoId = ref('');
const editForm = ref(createEmptyEditForm());
const isSavingPhoto = ref(false);

const filteredPhotos = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase();
  return photos.value.filter((photo) => {
    if (selectedTripFilter.value === 'unlinked' && photo.tripId) return false;
    if (selectedTripFilter.value !== 'all' && selectedTripFilter.value !== 'unlinked' && photo.tripId !== selectedTripFilter.value) return false;
    if (homeFilter.value === 'featured' && !photo.homeFeatured) return false;
    if (homeFilter.value === 'normal' && photo.homeFeatured) return false;
    if (!keyword) return true;
    return [photo.caption, photo.tripId, photo.location]
      .some(value => String(value || '').toLowerCase().includes(keyword));
  });
});

async function loadPhotos() {
  isFetching.value = true;
  try {
    const q = query(collection(db, 'photos'), orderBy('uploadedAt', 'desc'));
    const snap = await getDocs(q);
    photos.value = snap.docs.map(d => ({ docId: d.id, ...d.data() }));
  } finally {
    isFetching.value = false;
  }
}

async function loadTrips() {
  const q = query(collection(db, 'trip'), orderBy('semester', 'desc'));
  const snap = await getDocs(q);
  trips.value = snap.docs.map(d => ({ docId: d.id, id: d.id, ...d.data() }));
}

async function confirmDelete(photo) {
  if (!confirm(`確定刪除這張照片？\n${photo.caption || photo.url}`)) return;
  try {
    if (photo.storagePath) {
      await deleteObject(storageRef(storage, photo.storagePath));
    }
    await deleteDoc(doc(db, 'photos', photo.docId));
    photos.value = photos.value.filter(p => p.docId !== photo.docId);
  } catch (e) {
    alert('刪除失敗：' + e.message);
  }
}

function createEmptyEditForm() {
  return {
    caption: '',
    tripId: '',
    location: '',
    homeFeatured: false,
    homeOrder: '',
  };
}

function openEditPhoto(photo) {
  editingPhotoId.value = photo.docId;
  editForm.value = {
    caption: photo.caption || '',
    tripId: photo.tripId || '',
    location: photo.location || '',
    homeFeatured: Boolean(photo.homeFeatured),
    homeOrder: photo.homeOrder || '',
  };
}

function cancelEdit() {
  editingPhotoId.value = '';
  editForm.value = createEmptyEditForm();
}

async function savePhotoEdits(photo) {
  isSavingPhoto.value = true;
  try {
    const clean = {
      caption: editForm.value.caption.trim(),
      tripId: editForm.value.tripId.trim() || null,
      location: editForm.value.location.trim(),
      homeFeatured: Boolean(editForm.value.homeFeatured),
      homeOrder: editForm.value.homeFeatured ? normalizeOrder(editForm.value.homeOrder) : null,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(doc(db, 'photos', photo.docId), clean);
    Object.assign(photo, clean);
    cancelEdit();
  } catch (e) {
    alert('儲存失敗：' + e.message);
  } finally {
    isSavingPhoto.value = false;
  }
}

function normalizeOrder(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.round(number) : null;
}

// ── 上傳 ──
const fileInputRef = ref(null);
const selectedFiles = ref([]);
const uploadCaption = ref('');
const uploadTripId = ref('');
const uploadLocation = ref('');
const uploadHomeFeatured = ref(false);
const uploadHomeOrder = ref('');
const isUploading = ref(false);
const doneCount = ref(0);
const uploadLog = ref([]);

function onFileChange(e) {
  selectedFiles.value = Array.from(e.target.files);
  uploadLog.value = [];
  doneCount.value = 0;
}

function onDrop(e) {
  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
  selectedFiles.value = files;
  uploadLog.value = [];
  doneCount.value = 0;
}

function clearSelection(options) {
  const keepLog = options?.keepLog === true;
  selectedFiles.value = [];
  uploadCaption.value = '';
  uploadTripId.value = '';
  uploadLocation.value = '';
  uploadHomeFeatured.value = false;
  uploadHomeOrder.value = '';
  if (!keepLog) {
    uploadLog.value = [];
    doneCount.value = 0;
  }
  if (fileInputRef.value) fileInputRef.value.value = '';
}

async function compressImage(file, maxWidth = 1920, quality = 0.82) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

async function uploadFiles() {
  if (!selectedFiles.value.length) return;
  isUploading.value = true;
  doneCount.value = 0;
  uploadLog.value = [];

  const tripId = uploadTripId.value.trim() || null;
  const caption = uploadCaption.value.trim();
  const location = uploadLocation.value.trim();

  for (const file of selectedFiles.value) {
    try {
      const timestamp = Date.now();
      let storagePath = '';

      // 步驟 1：上傳到 Storage
      let url;
      try {
        const compressed = await compressImage(file);
        const compressedName = file.name.replace(/\.[^.]+$/, '.jpg');
        const safeName = compressedName.replace(/[^a-zA-Z0-9._-]/g, '_');
        storagePath = `photos/${tripId || 'general'}/${timestamp}_${safeName}`;
        const fileRef = storageRef(storage, storagePath);
        await uploadBytes(fileRef, compressed, { contentType: 'image/jpeg' });
        url = await getDownloadURL(fileRef);
      } catch (e) {
        uploadLog.value.push({ ok: false, text: `${file.name}（Storage 失敗）：${e.message}` });
        continue;
      }

      // 步驟 2：寫入 Firestore
      try {
        await addDoc(collection(db, 'photos'), {
          url,
          storagePath,
          tripId,
          caption,
          location,
          homeFeatured: uploadHomeFeatured.value,
          homeOrder: uploadHomeFeatured.value ? normalizeOrder(uploadHomeOrder.value) : null,
          uploadedAt: serverTimestamp(),
        });
      } catch (e) {
        uploadLog.value.push({ ok: false, text: `${file.name}（Firestore 寫入失敗）：${e.message}` });
        continue;
      }

      uploadLog.value.push({ ok: true, text: file.name });
    } catch (e) {
      uploadLog.value.push({ ok: false, text: `${file.name}：${e.message}` });
    } finally {
      doneCount.value++;
    }
  }

  isUploading.value = false;
  clearSelection({ keepLog: true });
  await loadPhotos();
}

onMounted(() => {
  loadPhotos();
  loadTrips();
});
</script>

<style scoped>
.admin-page { min-height: 100vh; background: #f5f7f5; }
.admin-main { max-width: 1100px; margin: 0 auto; padding: 32px 24px; display: flex; flex-direction: column; gap: 28px; }

.admin-section {
  background: white;
  border-radius: 14px;
  padding: 28px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
}
.admin-section h3 { color: #1A432D; font-size: 1.1rem; margin-bottom: 18px; }

.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
.section-header h3 { margin: 0; }

/* Upload */
.upload-area {
  border: 2px dashed #b5cfc0;
  border-radius: 10px;
  padding: 28px 20px;
  text-align: center;
  color: #777;
  margin-bottom: 16px;
}
.upload-area p { margin: 0 0 10px; }
.hidden-input { display: none; }
.file-count { color: #1A432D; font-weight: bold; }

.upload-meta { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
.field-row { display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 200px; }
.compact-field { flex: 0 1 170px; min-width: 150px; }
.field-row label { font-size: 0.82rem; color: #666; font-weight: 600; }
.field-row input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 7px;
  font-size: 0.95rem;
}
.field-row input:focus { outline: none; border-color: #1A432D; }
.check-row {
  flex-direction: row;
  align-items: center;
  gap: 7px;
  font-size: 0.86rem;
  color: #444;
}
.check-row input { width: auto; }

.upload-actions { display: flex; gap: 12px; margin-bottom: 14px; }

.upload-log { font-size: 0.85rem; display: flex; flex-direction: column; gap: 4px; }
.log-ok { color: #2e7d52; }
.log-err { color: #c0392b; }

.photo-filters {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) 220px 160px;
  gap: 12px;
  margin-bottom: 18px;
}
.photo-filters input,
.photo-filters select {
  border: 1px solid #d8e2dc;
  border-radius: 8px;
  padding: 9px 12px;
  font-family: inherit;
  font-size: 0.92rem;
}
.photo-filters input:focus,
.photo-filters select:focus {
  outline: none;
  border-color: #1A432D;
}

/* Photos grid */
.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
.photo-card {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  background: #f0f0f0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
}
.photo-card img {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
  display: block;
}
.photo-info {
  padding: 10px 12px 12px;
  font-size: 0.8rem;
}
.caption { color: #444; margin: 0 0 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.trip-id { color: #888; margin: 0 0 3px; font-size: 0.75rem; }
.photo-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin: 8px 0 10px;
}
.photo-badges span {
  background: #e8f5ee;
  color: #2e7d52;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 0.72rem;
  font-weight: 700;
}
.edit-grid {
  display: grid;
  gap: 8px;
}
.edit-grid label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #666;
  font-size: 0.76rem;
  font-weight: 700;
}
.edit-grid input {
  border: 1px solid #d8e2dc;
  border-radius: 7px;
  padding: 7px 9px;
  font-family: inherit;
}
.card-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 10px;
}
.btn-del {
  background: #fde8e8;
  color: #c0392b;
  border: none;
  border-radius: 7px;
  padding: 7px 12px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.2s;
}
.btn-del:hover { background: #c0392b; }
.btn-del:hover { color: white; }

.hint { color: #999; text-align: center; padding: 20px 0; }

/* Buttons */
.btn-primary {
  background: #1A432D; color: white; border: none;
  padding: 9px 22px; border-radius: 8px; font-size: 0.95rem;
  font-weight: bold; cursor: pointer; transition: background 0.2s;
}
.btn-primary:hover:not(:disabled) { background: #245c3d; }
.btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
.btn-secondary {
  background: #eee; color: #444; border: none;
  padding: 9px 22px; border-radius: 8px; font-size: 0.95rem;
  cursor: pointer; transition: background 0.2s;
}
.btn-secondary:hover:not(:disabled) { background: #ddd; }
.btn-pick {
  background: #1A432D; color: white; border: none;
  padding: 8px 20px; border-radius: 7px; font-size: 0.9rem;
  cursor: pointer; transition: background 0.2s;
}
.btn-pick:hover { background: #245c3d; }
.small {
  padding: 6px 12px;
  font-size: 0.82rem;
}

@media (max-width: 760px) {
  .photo-filters { grid-template-columns: 1fr; }
}
</style>
