# 中原大學登山社網站

Nuxt 3 + Firebase 架設的中原大學登山社官方網站，包含首頁、社史、隊伍回顧、學期行程、入社資訊、FAQ 與後台管理。

## 開發

需要 Node.js 20.19 以上，並先安裝 npm 套件。

```sh
npm install
npm run dev
```

## 建置與部署

本專案以 Nuxt SPA/static 模式輸出，Firebase Hosting 會部署 `.output/public`。

```sh
npm run build
firebase deploy
```

只部署 Hosting：

```sh
npm run build
firebase deploy --only hosting
```

## Firebase Rules

Firebase 設定在 `firebase.json`、`firestore.rules` 與 `storage.rules`。

- 前台可讀取公開頁面需要的資料。
- 後台管理頁使用 Firebase Auth 驗證。
- `admins` collection 可用來搭配後台權限規則。

正式上線前建議再依實際管理者名單加入 custom claims 或 UID allowlist。

## Nuxt Notes

- 主要頁面仍放在 `src/views`，Nuxt 路由 wrapper 放在 `src/pages`。
- 後台路由透過 `src/middleware/auth.client.js` 保護。
- AOS 動畫改由 `src/plugins/aos.client.js` 初始化。
