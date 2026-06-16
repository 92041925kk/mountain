import admin from 'firebase-admin';
import fs from 'fs';

// 1. 讀取你的金鑰 (請確認檔名和路徑正確)
const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));

// 2. 讀取你準備好的行事曆資料
const scheduleData = JSON.parse(fs.readFileSync('./scripts/schedule.json', 'utf8'));

// 3. 初始化 Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 4. 執行上傳
async function uploadData() {
  try {
    console.log('🚀 開始上傳行事曆資料至 Firebase...');
    
    // 將資料寫入 schedules 集合下的 114-2 文件
    await db.collection('schedules').doc('114-2').set(scheduleData);
    
    console.log('🎉 上傳成功！快去 Firebase 後台重新整理看看！');
  } catch (error) {
    console.error('❌ 上傳失敗，錯誤訊息：', error);
  } finally {
    process.exit(); // 執行完畢後自動關閉腳本
  }
}

uploadData();