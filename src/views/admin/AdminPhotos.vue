<template>
  <div class="admin-page">
    <AdminHeader title="照片管理" />

    <main class="admin-main">

      <AdminHelpPanel title="操作說明：怎麼上傳與管理照片？">
        <ul>
          <li><strong>上傳</strong>：把圖片拖進上傳區或按「選擇圖片」（可一次多張），系統會自動壓縮後上傳。</li>
          <li><strong>說明 / 行程 ID / 位置</strong>（皆選填）：填了之後，現有照片區可用來搜尋與篩選；「行程 ID」對應「行程紀錄管理」那筆的代號，綁定後照片會跟該行程關聯。</li>
          <li><strong>首頁精選</strong>：勾選後這張才會出現在<strong>首頁照片牆</strong>；「首頁排序」數字越小越前面（未勾選不影響）。</li>
        </ul>
        <p>已上傳的照片可在下方「現有照片」逐張<strong>編輯</strong>說明、綁定行程、改首頁精選，或<strong>刪除</strong>。</p>
        <p class="help-note">換首頁封面不是在這裡：請到「<strong>網站設定 → 首頁封面</strong>」貼上封面照片的路徑。照片大小建議小於 15MB、格式用常見的 jpg／png。</p>
      </AdminHelpPanel>

      <section class="admin-section">
        <h3>上傳新照片</h3>
        <div class="upload-area" @dragover.prevent @drop.prevent="onDrop">
          <p>拖放圖片到這裡，或</p>
          <input
            ref="fileInputRef"
            type="file"
            multiple
            accept="image/*"
            class="hidden-input"
            @change="onFileChange"
          />
          <button class="btn-pick" type="button" @click="fileInputRef.click()">選擇圖片</button>
          <span class="file-count" v-if="selectedFiles.length"> 已選 {{ selectedFiles.length }} 張</span>
        </div>

        <div class="upload-meta" v-if="selectedFiles.length">
          <div class="field-row">
            <label>說明文字（選填）</label>
            <input v-model="uploadCaption" placeholder="例：老梅溪溯溪" />
          </div>
          <div class="field-row">
            <label>行程 ID（選填）</label>
            <input v-model="uploadTripId" placeholder="例：laomei-creek-2026" list="trip-id-options" />
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
          <button class="btn-primary" type="button" @click="uploadFiles" :disabled="isUploading">
            {{ isUploading ? `壓縮上傳中... (${doneCount}/${selectedFiles.length})` : `上傳 ${selectedFiles.length} 張` }}
          </button>
          <button class="btn-secondary" type="button" @click="clearSelection" :disabled="isUploading">清除選取</button>
        </div>

        <div class="upload-log" v-if="uploadLog.length">
          <p v-for="(msg, i) in uploadLog" :key="i" :class="msg.ok ? 'log-ok' : 'log-err'">
            {{ msg.ok ? '成功' : '失敗' }}：{{ msg.text }}
          </p>
        </div>
      </section>

      <section class="admin-section">
        <div class="section-header">
          <h3>現有照片（{{ filteredPhotos.length }} / {{ photos.length }} 張）</h3>
          <button class="btn-secondary" type="button" @click="loadPhotos">重新整理</button>
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
                  <button class="btn-secondary small" type="button" @click="cancelEdit">取消</button>
                  <button class="btn-primary small" type="button" @click="savePhoto(photo)" :disabled="isSavingPhoto">
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
                  <button class="btn-secondary small" type="button" @click="openEditPhoto(photo)">編輯</button>
                  <button class="btn-del small" type="button" @click="confirmDelete(photo)">刪除</button>
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
import { onMounted } from 'vue';
import AdminHeader from '../../components/admin/AdminHeader.vue';
import AdminHelpPanel from '../../components/admin/AdminHelpPanel.vue';
import { useAdminPhotos } from '../../composables/useAdminPhotos';

const {
  photos,
  trips,
  isFetching,
  searchQuery,
  selectedTripFilter,
  homeFilter,
  editingPhotoId,
  editForm,
  isSavingPhoto,
  filteredPhotos,
  fileInputRef,
  selectedFiles,
  uploadCaption,
  uploadTripId,
  uploadLocation,
  uploadHomeFeatured,
  uploadHomeOrder,
  isUploading,
  doneCount,
  uploadLog,
  loadPhotos,
  loadInitialData,
  deletePhoto,
  openEditPhoto,
  cancelEdit,
  savePhotoEdits,
  onFileChange,
  onDrop,
  clearSelection,
  uploadFiles,
} = useAdminPhotos();

async function savePhoto(photo) {
  try {
    await savePhotoEdits(photo);
  } catch (e) {
    alert('儲存失敗：' + e.message);
  }
}

async function confirmDelete(photo) {
  if (!confirm(`確定刪除這張照片？\n${photo.caption || photo.url}`)) return;

  try {
    await deletePhoto(photo);
  } catch (e) {
    alert('刪除失敗：' + e.message);
  }
}

onMounted(loadInitialData);
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

.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; gap: 12px; flex-wrap: wrap; }
.section-header h3 { margin: 0; }

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
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 7px;
  font-size: 0.86rem;
  color: #444;
}
.check-row input { width: auto; }

.upload-actions { display: flex; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }

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
  transition: background 0.2s, color 0.2s;
}
.btn-del:hover { background: #c0392b; color: white; }

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
