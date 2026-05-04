# 中原大學登山社網站

Vue 3 + Vite + Firebase 建置的中原大學登山社網站。

## 開發環境

建議使用 Node.js 20.19 以上，並統一使用 npm。

```sh
npm install
npm run dev
npm run build
```

## Firebase Rules

專案已補上 `firebase.json`、`firestore.rules`、`storage.rules`。

目前規則採用：

- 公開讀取網站前台資料與圖片。
- 已登入 Firebase Auth 的使用者可以寫入後台資料、照片、GPX 與網站設定。
- `admins` 與未列出的集合預設拒絕存取。

若之後要開放註冊或新增不同權限角色，建議再改成 Firebase custom claims 或 UID allowlist，避免所有已登入帳號都有後台寫入權限。

部署規則：

```sh
npm run build
firebase deploy
```

若只要更新網站前端：

```sh
npm run build
firebase deploy --only hosting
```

後台路由使用 Vue Router history mode，`firebase.json` 已設定 Hosting rewrite，讓 `/cymc-admin` 與 `/cymc-admin/*` 直接開啟或重新整理時都會回到 `index.html`。

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar)。

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).
