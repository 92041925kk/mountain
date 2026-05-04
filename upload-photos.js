import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// ──────────────────────────────────────────────
// 設定區：上傳前請修改這裡
// ──────────────────────────────────────────────
const LOCAL_FOLDER = './photos-to-upload';   // 本地照片資料夾路徑
const TRIP_ID = 'laomei-creek-2026';         // 對應的行程 ID（可設 null = 通用照片）
const CAPTION_PREFIX = '';                    // 說明文字前綴，例如 '老梅溪' → '老梅溪_img1.jpg'
// ──────────────────────────────────────────────

const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'cymc2-7d93e.firebasestorage.app'
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

const SUPPORTED_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

async function uploadPhoto(localFilePath, fileName) {
  const destination = `photos/${TRIP_ID || 'general'}/${fileName}`;
  console.log(`📤 上傳中: ${fileName}`);

  await bucket.upload(localFilePath, {
    destination,
    metadata: {
      contentType: getContentType(fileName),
    }
  });

  const file = bucket.file(destination);
  await file.makePublic();

  const url = `https://storage.googleapis.com/${bucket.name}/${destination}`;
  return url;
}

function getContentType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const map = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
  };
  return map[ext] || 'image/jpeg';
}

async function run() {
  if (!fs.existsSync(LOCAL_FOLDER)) {
    console.error(`❌ 找不到資料夾: ${LOCAL_FOLDER}`);
    console.log('👉 請建立該資料夾並放入照片後再執行');
    process.exit(1);
  }

  const files = fs.readdirSync(LOCAL_FOLDER).filter(f =>
    SUPPORTED_EXTS.includes(path.extname(f).toLowerCase())
  );

  if (files.length === 0) {
    console.log('⚠️ 資料夾內沒有支援的圖片（jpg/jpeg/png/webp/gif）');
    process.exit(0);
  }

  console.log(`📂 找到 ${files.length} 張照片，開始上傳...\n`);

  let successCount = 0;

  for (const fileName of files) {
    const localFilePath = path.join(LOCAL_FOLDER, fileName);
    try {
      const url = await uploadPhoto(localFilePath, fileName);

      // 寫入 Firestore photos collection
      await db.collection('photos').add({
        url,
        storagePath: destination,
        tripId: TRIP_ID || null,
        caption: CAPTION_PREFIX ? `${CAPTION_PREFIX} - ${path.basename(fileName, path.extname(fileName))}` : '',
        uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`  ✅ ${fileName} → ${url}\n`);
      successCount++;
    } catch (err) {
      console.error(`  ❌ ${fileName} 上傳失敗: ${err.message}\n`);
    }
  }

  console.log(`\n🎉 完成！成功上傳 ${successCount} / ${files.length} 張`);
  process.exit(0);
}

run();
