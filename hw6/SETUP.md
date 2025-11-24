# LINE RPG Bot 設定指南

## 環境變數設定

建立 `.env.local` 檔案（本地開發）或在 Vercel 設定環境變數（生產環境）：

### 必要環境變數

```env
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret
GEMINI_API_KEY=your_gemini_api_key
MONGODB_URI=mongodb://localhost:27017/line-rpg-bot
```

## LINE Bot 設定步驟

### 1. 建立 LINE Channel

1. 前往 [LINE Developers Console](https://developers.line.biz/console/)
2. 選擇或建立 Provider
3. 建立新的 Channel，選擇 "Messaging API"
4. 記下以下資訊：
   - Channel Access Token
   - Channel Secret

### 2. 設定 Webhook URL

1. 在 Channel 設定頁面，找到 "Messaging API" 區塊
2. 設定 Webhook URL：
   - 本地測試：使用 ngrok 提供的 URL，例如 `https://xxxx.ngrok.io/api/webhook`
   - 生產環境：使用 Vercel 部署後的 URL，例如 `https://your-app.vercel.app/api/webhook`
3. 點擊 "Verify" 驗證 Webhook
4. 啟用 "Use webhook"

### 3. 設定自動回覆訊息（可選）

在 LINE Developers Console 中：
- 關閉 "Auto-reply messages"（讓 Bot 完全由 Webhook 控制）
- 或設定歡迎訊息

## Gemini API 設定

1. 前往 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 建立新的 API Key
3. 將 API Key 設定到環境變數 `GEMINI_API_KEY`

## MongoDB 設定

### 選項 1: MongoDB Atlas（推薦生產環境）

1. 前往 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. 建立免費帳號
3. 建立新的 Cluster
4. 建立 Database User
5. 設定 Network Access（允許所有 IP 或特定 IP）
6. 取得 Connection String，格式：
   ```
   mongodb+srv://username:password@cluster.mongodb.net/line-rpg-bot
   ```

### 選項 2: 本地 MongoDB

1. 安裝 MongoDB
2. 啟動 MongoDB 服務
3. 使用連線字串：`mongodb://localhost:27017/line-rpg-bot`

## 本地測試

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

建立 `.env.local` 檔案並填入所有必要的環境變數。

### 3. 啟動開發伺服器

```bash
npm run dev
```

### 4. 使用 ngrok 暴露本地伺服器

```bash
ngrok http 3000
```

### 5. 設定 LINE Webhook URL

將 ngrok 提供的 URL（例如 `https://xxxx.ngrok.io`）設定到 LINE Webhook URL：
```
https://xxxx.ngrok.io/api/webhook
```

### 6. 測試 Bot

1. 在 LINE 中搜尋你的 Bot
2. 加入好友
3. 發送訊息測試

## Vercel 部署

### 1. 準備專案

確保所有檔案都已提交到 Git repository。

### 2. 連接到 Vercel

1. 前往 [Vercel](https://vercel.com/)
2. 點擊 "New Project"
3. 匯入你的 Git repository
4. 設定專案名稱和框架（Next.js）

### 3. 設定環境變數

在 Vercel 專案設定中，新增以下環境變數：
- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`
- `GEMINI_API_KEY`
- `MONGODB_URI`

### 4. 部署

點擊 "Deploy" 開始部署。

### 5. 更新 LINE Webhook URL

部署完成後，將 Vercel 提供的 URL 設定到 LINE Webhook URL：
```
https://your-app.vercel.app/api/webhook
```

## 驗證設定

### 檢查 Webhook

1. 在 LINE Developers Console 中點擊 "Verify"
2. 應該顯示 "Success"

### 測試 Bot

1. 在 LINE 中搜尋你的 Bot
2. 發送訊息 "開始" 或點擊 Quick Reply 按鈕
3. 應該收到 Bot 的回應

### 檢查管理後台

1. 訪問 `https://your-app.vercel.app/admin`
2. 應該能看到對話紀錄和統計資料

## 常見問題

### Webhook 驗證失敗

- 檢查 Webhook URL 是否正確
- 確認伺服器正在運行
- 檢查環境變數是否正確設定

### Bot 沒有回應

- 檢查 LINE Channel Access Token 是否正確
- 查看伺服器日誌是否有錯誤
- 確認 Webhook 已啟用

### MongoDB 連線失敗

- 檢查 MongoDB URI 是否正確
- 確認 MongoDB 服務正在運行（本地）
- 檢查 Network Access 設定（Atlas）

### Gemini API 錯誤

- 檢查 API Key 是否正確
- 確認 API 配額是否足夠
- 查看 rate limiting 設定

