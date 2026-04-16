import admin from 'firebase-admin';
import fs from 'fs';

// 1. 讀取同一把 Firebase 金鑰
const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));

// 2. 讀取你準備好的「單一隊伍行程」JSON
const tripData = JSON.parse(fs.readFileSync('./src/data/trip_detail.json', 'utf8'));

// 初始化 Firebase
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// 執行上傳
async function uploadTrip() {
  try {
    const docId = tripData.id;
    if (!docId) {
      throw new Error("你的 JSON 檔案裡面沒有設定 'id' 欄位！");
    }
    
    console.log(`🚀 正在將隊伍「${tripData.title}」上傳至 Firebase trip 集合 (ID: ${docId})...`);
    
    // 🌟 將資料寫入 'trip' 集合
    await db.collection('trip').doc(docId).set(tripData);
    
    console.log(`🎉 上傳成功！網址測試： http://localhost:5173/trip?id=${docId}`);
  } catch (error) {
    console.error('❌ 上傳失敗：', error.message);
  } finally {
    process.exit();
  }
}

uploadTrip();