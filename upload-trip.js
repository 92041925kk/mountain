import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// 1. 讀取 Firebase 金鑰
const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));

// 2. 讀取「單一隊伍行程」JSON
const tripData = JSON.parse(fs.readFileSync('./src/data/trip_detail.json', 'utf8'));

// 初始化 Firebase
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'cymc2-7d93e.firebasestorage.app'
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

// 上傳 GPX 檔至 Firebase Storage，回傳公開 URL
async function uploadGpxFile(localPath, tripId) {
  if (!fs.existsSync(localPath)) {
    console.error(`⚠️ 找不到 GPX 檔案: ${localPath}，跳過上傳`);
    return null;
  }

  const fileName = `gpx/${tripId}/${path.basename(localPath)}`;
  console.log(`📤 上傳 GPX: ${localPath} → ${fileName}`);

  await bucket.upload(localPath, {
    destination: fileName,
    metadata: {
      contentType: 'application/gpx+xml',
      metadata: { firebaseStorageDownloadTokens: tripId }
    }
  });

  const file = bucket.file(fileName);
  await file.makePublic();
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
  console.log(`✅ GPX 公開網址: ${publicUrl}`);
  return publicUrl;
}

// 執行上傳
async function uploadTrip() {
  try {
    const docId = tripData.id;
    if (!docId) {
      throw new Error("你的 JSON 檔案裡面沒有設定 'id' 欄位！");
    }

    // 如果有指定本地 GPX 檔案路徑，自動上傳並替換成公開 URL
    if (tripData.gpxFile) {
      const gpxUrl = await uploadGpxFile(tripData.gpxFile, docId);
      if (gpxUrl) {
        tripData.gpxUrl = gpxUrl;
      }
      delete tripData.gpxFile; // 不把本地路徑存進 Firestore
    }
    
    console.log(`🚀 正在將隊伍「${tripData.title}」上傳至 Firebase trip 集合 (ID: ${docId})...`);
    
    await db.collection('trip').doc(docId).set(tripData);
    
    console.log(`🎉 上傳成功！網址測試： http://localhost:5173/trip?id=${docId}`);
  } catch (error) {
    console.error('❌ 上傳失敗：', error.message);
  } finally {
    process.exit();
  }
}

uploadTrip();