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
          <h3>現有照片（{{ photos.length }} 張）</h3>
          <button class="btn-secondary" @click="loadPhotos">重新整理</button>
        </div>

        <div v-if="isFetching" class="hint">載入中...</div>
        <div v-else-if="photos.length === 0" class="hint">尚無照片</div>
        <div v-else class="photos-grid">
          <div v-for="photo in photos" :key="photo.docId" class="photo-card">
            <img :src="photo.url" :alt="photo.caption || '照片'" />
            <div class="photo-info">
              <p class="caption">{{ photo.caption || '（無說明）' }}</p>
              <p class="trip-id" v-if="photo.tripId">{{ photo.tripId }}</p>
            </div>
            <button class="btn-del" @click="confirmDelete(photo)" title="刪除">✕</button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  serverTimestamp, query, orderBy
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../firebase';
import AdminHeader from '../../components/admin/AdminHeader.vue';

// ── 現有照片 ──
const photos = ref([]);
const isFetching = ref(false);

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

// ── 上傳 ──
const fileInputRef = ref(null);
const selectedFiles = ref([]);
const uploadCaption = ref('');
const uploadTripId = ref('');
const isUploading = ref(false);
const doneCount = ref(0);
const uploadLog = ref([]);

function onFileChange(e) {
  selectedFiles.value = Array.from(e.target.files);
  uploadLog.value = [];
}

function onDrop(e) {
  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
  selectedFiles.value = files;
  uploadLog.value = [];
}

function clearSelection() {
  selectedFiles.value = [];
  uploadCaption.value = '';
  uploadTripId.value = '';
  uploadLog.value = [];
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
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
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
          uploadedAt: serverTimestamp(),
        });
      } catch (e) {
        uploadLog.value.push({ ok: false, text: `${file.name}（Firestore 寫入失敗）：${e.message}` });
        continue;
      }

      uploadLog.value.push({ ok: true, text: file.name });
      doneCount.value++;
    } catch (e) {
      uploadLog.value.push({ ok: false, text: `${file.name}：${e.message}` });
    }
  }

  isUploading.value = false;
  clearSelection();
  await loadPhotos();
}

onMounted(loadPhotos);
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
.field-row label { font-size: 0.82rem; color: #666; font-weight: 600; }
.field-row input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 7px;
  font-size: 0.95rem;
}
.field-row input:focus { outline: none; border-color: #1A432D; }

.upload-actions { display: flex; gap: 12px; margin-bottom: 14px; }

.upload-log { font-size: 0.85rem; display: flex; flex-direction: column; gap: 4px; }
.log-ok { color: #2e7d52; }
.log-err { color: #c0392b; }

/* Photos grid */
.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 14px;
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
  padding: 8px 10px;
  font-size: 0.8rem;
}
.caption { color: #444; margin: 0 0 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.trip-id { color: #888; margin: 0; font-size: 0.75rem; }
.btn-del {
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(0,0,0,0.55);
  color: white;
  border: none;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.75rem;
  line-height: 1;
  transition: background 0.2s;
}
.btn-del:hover { background: #c0392b; }

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
</style>
