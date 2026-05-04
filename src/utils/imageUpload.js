import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { storage } from '../firebase';

export async function compressImage(file, maxWidth = 1920, quality = 0.82) {
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

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

export function safeImageName(fileName) {
  return fileName
    .replace(/\.[^.]+$/, '.jpg')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function uploadImageFile(file, folder, options = {}) {
  const compressed = await compressImage(file, options.maxWidth ?? 1920, options.quality ?? 0.82);
  const fileName = `${Date.now()}_${safeImageName(file.name)}`;
  const storagePath = `${folder.replace(/\/$/, '')}/${fileName}`;
  const fileRef = storageRef(storage, storagePath);

  await uploadBytes(fileRef, compressed, { contentType: 'image/jpeg' });
  const url = await getDownloadURL(fileRef);

  return { url, storagePath };
}
