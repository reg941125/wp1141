# 快速開始指南

## 🚀 5 分鐘快速設定

### 1. 複製環境變數檔案
```bash
# Windows PowerShell
Copy-Item env.example .env.local

# macOS/Linux
cp env.example .env.local
```

### 2. 編輯 `.env.local` 填入憑證
```env
LINE_CHANNEL_ACCESS_TOKEN=你的_TOKEN
LINE_CHANNEL_SECRET=你的_SECRET
GEMINI_API_KEY=你的_API_KEY
MONGODB_URI=mongodb://localhost:27017/line-rpg-bot
```

### 3. 檢查環境變數
```bash
npm run check-env
```

### 4. 啟動開發伺服器
```bash
npm run dev
```

### 5. 啟動 ngrok（新終端）
```bash
ngrok http 3000
```

### 6. 設定 LINE Webhook URL
在 LINE Developers Console 設定：
```
https://你的-ngrok-url.ngrok-free.app/api/webhook
```
或
```
https://你的-ngrok-url.ngrok-free.app/api/line/webhook
```

## 📍 重要端點

- **Webhook**: `/api/webhook` 或 `/api/line/webhook`
- **管理後台**: http://localhost:3000/admin
- **對話 API**: `/api/conversations`
- **統計 API**: `/api/stats`

## ✅ 測試檢查清單

- [ ] MongoDB 正在運行
- [ ] `.env.local` 已設定
- [ ] 開發伺服器運行在 http://localhost:3000
- [ ] ngrok 正在運行並顯示 HTTPS URL
- [ ] LINE Webhook URL 已設定並驗證成功
- [ ] 可以在 LINE 中發送訊息給 Bot

## 🐛 常見問題

**404 錯誤**: 確認 Webhook URL 路徑正確（`/api/webhook` 或 `/api/line/webhook`）

**Webhook 驗證失敗**: 
- 確認 ngrok 正在運行
- 確認開發伺服器正在運行
- 檢查環境變數是否正確

**MongoDB 連線失敗**:
- 本地: 確認 MongoDB 服務正在運行
- Atlas: 檢查 Network Access 設定

## 📚 詳細文件

- 完整設定指南: `LOCAL_TEST.md`
- 部署指南: `SETUP.md`
- 專案說明: `README.md`

