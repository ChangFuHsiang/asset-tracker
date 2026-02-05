# 資產配置追蹤系統（網頁版）

個人資產配置追蹤工具，支援多帳戶管理、總資產曲線圖、配置比例圓餅圖。

## 功能特色

- 📊 總資產變化曲線圖
- 🥧 資產配置比例圓餅圖
- 💰 多帳戶管理（銀行、投資、現金等）
- 📱 支援手機瀏覽器，可加到主畫面
- 🌙 深色主題介面
- 💾 資料存在本地（localStorage）
- 📤 匯出/匯入 JSON 備份
- 📶 離線使用支援（PWA）

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 本地開發

```bash
npm run dev
```

然後打開瀏覽器前往 http://localhost:5173

### 3. 建置正式版本

```bash
npm run build
```

建置後的檔案會在 `dist` 資料夾中。

## 部署到 Vercel

1. 把專案推到 GitHub
2. 前往 [vercel.com](https://vercel.com)
3. 用 GitHub 帳號登入
4. 點「Add New Project」→ 選擇你的 repo
5. 直接點「Deploy」即可

## 加到手機主畫面

### iOS (Safari)
1. 用 Safari 打開網站
2. 點下方分享按鈕
3. 選「加入主畫面」

### Android (Chrome)
1. 用 Chrome 打開網站
2. 點右上角選單
3. 選「加到主畫面」或「安裝應用程式」

## 技術架構

- React 18
- Vite
- Recharts（圖表）
- localStorage（資料儲存）
- vite-plugin-pwa（離線支援）

## 授權

MIT License
