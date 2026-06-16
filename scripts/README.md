# scripts/ — 一次性匯入工具（封存）

> ⚠️ **正常維護網站不需要用到這個資料夾。**
> 這裡放的是當初「第一次把資料倒進 Firebase」用的一次性腳本。
> 日常的行事曆、行程、照片更新，請直接用**網站後台**完成
> （見專案根目錄的 [後台操作手冊.md](../後台操作手冊.md)）。

## 這裡有什麼

| 檔案 | 用途 |
|---|---|
| `upload-schedule.js` | 把 `schedule.json` 一次性匯入 Firestore 的 `schedules` 集合 |
| `upload-trip.js` | 把 `trip_detail.json` 一次性匯入 Firestore 的 `trip` 集合 |
| `upload-photos.js` | 把本機資料夾的照片批次上傳到 Storage 與 `photos` 集合 |
| `schedule.json` / `trip_detail.json` | 上面腳本要讀的舊資料樣本（**不是**網站正在使用的資料） |

**網站真正在用的資料都在 Firebase，不是這些 JSON 檔。** 留著它們只是當作格式參考與歷史紀錄。

## 真的需要再跑一次的話

這些腳本需要 Firebase 的 `serviceAccountKey.json`（私鑰，**已被 .gitignore 排除、不會進版控**）。
從 Firebase Console → 專案設定 → 服務帳戶 下載後放到**專案根目錄**，然後在**專案根目錄**執行：

```sh
npm install firebase-admin   # 若尚未安裝
node scripts/upload-schedule.js
node scripts/upload-trip.js
node scripts/upload-photos.js
```

> 註：`upload-photos.js` 為早期版本、未經完整測試（含一處變數作用域問題），
> 若要批次上傳照片，建議優先用後台的「照片管理」拖放上傳。
