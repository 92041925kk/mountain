import { computed, ref } from 'vue';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { deleteObject, ref as storageRef } from 'firebase/storage';
import { db, storage } from '../firebase';
import { uploadImageFile } from '../utils/imageUpload';

function createEmptyEditForm() {
  return {
    caption: '',
    tripId: '',
    location: '',
    homeFeatured: false,
    homeOrder: '',
  };
}

function normalizeOrder(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.round(number) : null;
}

export function useAdminPhotos() {
  const photos = ref([]);
  const trips = ref([]);
  const isFetching = ref(false);
  const searchQuery = ref('');
  const selectedTripFilter = ref('all');
  const homeFilter = ref('all');
  const editingPhotoId = ref('');
  const editForm = ref(createEmptyEditForm());
  const isSavingPhoto = ref(false);

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

  const filteredPhotos = computed(() => {
    const keyword = searchQuery.value.trim().toLowerCase();

    return photos.value.filter((photo) => {
      if (selectedTripFilter.value === 'unlinked' && photo.tripId) return false;
      if (
        selectedTripFilter.value !== 'all'
        && selectedTripFilter.value !== 'unlinked'
        && photo.tripId !== selectedTripFilter.value
      ) return false;
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
      const photosQuery = query(collection(db, 'photos'), orderBy('uploadedAt', 'desc'));
      const snap = await getDocs(photosQuery);
      photos.value = snap.docs.map(d => ({ docId: d.id, ...d.data() }));
    } finally {
      isFetching.value = false;
    }
  }

  async function loadTrips() {
    const tripsQuery = query(collection(db, 'trip'), orderBy('semester', 'desc'));
    const snap = await getDocs(tripsQuery);
    trips.value = snap.docs.map(d => ({ docId: d.id, id: d.id, ...d.data() }));
  }

  async function deletePhoto(photo) {
    if (photo.storagePath) {
      await deleteObject(storageRef(storage, photo.storagePath));
    }
    await deleteDoc(doc(db, 'photos', photo.docId));
    photos.value = photos.value.filter(p => p.docId !== photo.docId);
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
    } finally {
      isSavingPhoto.value = false;
    }
  }

  function onFileChange(e) {
    selectedFiles.value = Array.from(e.target.files || []);
    uploadLog.value = [];
    doneCount.value = 0;
  }

  function onDrop(e) {
    selectedFiles.value = Array.from(e.dataTransfer.files)
      .filter(file => file.type.startsWith('image/'));
    uploadLog.value = [];
    doneCount.value = 0;
  }

  function clearSelection(options = {}) {
    const keepLog = options.keepLog === true;
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
        const uploaded = await uploadImageFile(file, `photos/${tripId || 'general'}`, {
          maxWidth: 1920,
          quality: 0.82,
        });

        await addDoc(collection(db, 'photos'), {
          url: uploaded.url,
          storagePath: uploaded.storagePath,
          tripId,
          caption,
          location,
          homeFeatured: uploadHomeFeatured.value,
          homeOrder: uploadHomeFeatured.value ? normalizeOrder(uploadHomeOrder.value) : null,
          uploadedAt: serverTimestamp(),
        });

        uploadLog.value.push({ ok: true, text: file.name });
      } catch (e) {
        uploadLog.value.push({ ok: false, text: `${file.name}: ${e.message}` });
      } finally {
        doneCount.value++;
      }
    }

    isUploading.value = false;
    clearSelection({ keepLog: true });
    await loadPhotos();
  }

  async function loadInitialData() {
    await Promise.all([loadPhotos(), loadTrips()]);
  }

  return {
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
    loadTrips,
    loadInitialData,
    deletePhoto,
    openEditPhoto,
    cancelEdit,
    savePhotoEdits,
    onFileChange,
    onDrop,
    clearSelection,
    uploadFiles,
  };
}
