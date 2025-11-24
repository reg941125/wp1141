# 本地測試指南

本指南將幫助你在本地環境使用 ngrok 測試 LINE Bot。

## 前置需求

1. **Node.js** (已安裝)
2. **MongoDB** - 本地安裝或使用 MongoDB Atlas
3. **ngrok** - 用於將本地伺服器暴露到公網
4. **LINE Channel** - 已在 LINE Developers Console 建立
5. **Gemini API Key** - 已從 Google AI Studio 取得

## 步驟 1: 安裝 ngrok

### Windows
1. 前往 https://ngrok.com/download
2. 下載 Windows 版本
3. 解壓縮並將 ngrok.exe 放到方便的位置（或加入 PATH）

### macOS
```bash
brew install ngrok
```

### Linux
```bash
# 下載並解壓縮
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar -xzf ngrok-v3-stable-linux-amd64.tgz
sudo mv ngrok /usr/local/bin/
```

## 步驟 2: 設定環境變數

1. 複製 `env.example` 為 `.env.local`：
   ```bash
   # Windows PowerShell
   Copy-Item env.example .env.local
   
   # macOS/Linux
   cp env.example .env.local
   ```

2. 編輯 `.env.local`，填入你的憑證：
   ```env
   LINE_CHANNEL_ACCESS_TOKEN=你的_LINE_Channel_Access_Token
   LINE_CHANNEL_SECRET=你的_LINE_Channel_Secret
   GEMINI_API_KEY=你的_Gemini_API_Key
   MONGODB_URI=mongodb://localhost:27017/line-rpg-bot
   ```

## 步驟 3: 設定 MongoDB

### 選項 A: 本地 MongoDB

1. 確保 MongoDB 服務正在運行：
   ```bash
   # Windows (以管理員身份運行)
   net start MongoDB
   
   # macOS (使用 Homebrew)
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

2. 驗證 MongoDB 運行中：
   ```bash
   mongosh
   # 或
   mongo
   ```

### 選項 B: MongoDB Atlas（雲端）

1. 前往 https://www.mongodb.com/cloud/atlas
2. 建立免費帳號和 Cluster
3. 建立 Database User
4. 設定 Network Access（暫時允許所有 IP：0.0.0.0/0）
5. 取得 Connection String 並更新 `.env.local` 中的 `MONGODB_URI`

## 步驟 4: 安裝依賴並啟動開發伺服器

```bash
# 安裝依賴（如果還沒安裝）
npm install

# 啟動開發伺服器
npm run dev
```

伺服器應該會在 http://localhost:3000 運行。

## 步驟 5: 啟動 ngrok

開啟**新的終端視窗**，執行：

```bash
ngrok http 3000
```

你會看到類似以下的輸出：
```
Forwarding    https://xxxx-xxxx-xxxx.ngrok-free.app -> http://localhost:3000
```

**記下這個 HTTPS URL**（例如：`https://xxxx-xxxx-xxxx.ngrok-free.app`）

## 步驟 6: 設定 LINE Webhook

1. 前往 [LINE Developers Console](https://developers.line.biz/console/)
2. 選擇你的 Channel
3. 在 "Messaging API" 區塊找到 "Webhook settings"
4. 設定 Webhook URL 為以下任一選項：
   ```
   https://xxxx-xxxx-xxxx.ngrok-free.app/api/webhook
   ```
   或
   ```
   https://xxxx-xxxx-xxxx.ngrok-free.app/api/line/webhook
   ```
   （將 `xxxx-xxxx-xxxx` 替換為你的 ngrok URL）
5. 點擊 "Verify" 驗證 Webhook
6. 確保 "Use webhook" 已啟用
7. 關閉 "Auto-reply messages"（讓 Bot 完全由 Webhook 控制）

## 步驟 7: 測試 Bot

1. 在 LINE 中搜尋你的 Bot（使用 Channel 名稱或 QR Code）
2. 加入好友
3. 發送訊息測試：
   - 發送 "開始" 或 "start"
   - 點擊 Quick Reply 按鈕（探索、查看狀態、前往城鎮）
   - 測試各種遊戲功能

## 步驟 8: 查看管理後台

在瀏覽器開啟：
```
http://localhost:3000/admin
```

你應該能看到：
- 對話紀錄
- 統計資料
- 即時更新（每 5 秒自動刷新）

## 常見問題

### ngrok 連線失敗

- 確保開發伺服器正在運行（`npm run dev`）
- 檢查 ngrok URL 是否正確
- 確認防火牆沒有阻擋連線

### Webhook 驗證失敗

- 確認 Webhook URL 格式正確（必須是 HTTPS）
- 檢查 ngrok 是否正在運行
- 確認開發伺服器正在運行
- 查看終端是否有錯誤訊息

### MongoDB 連線失敗

**本地 MongoDB：**
- 確認 MongoDB 服務正在運行
- 檢查 `MONGODB_URI` 是否正確
- 確認 MongoDB 監聽在預設端口 27017

**MongoDB Atlas：**
- 檢查 Network Access 設定（允許你的 IP）
- 確認 Connection String 格式正確
- 檢查 Database User 權限

### Bot 沒有回應

- 檢查終端是否有錯誤訊息
- 確認環境變數已正確設定
- 檢查 LINE Channel Access Token 是否正確
- 查看 MongoDB 是否有資料寫入

### Gemini API 錯誤

- 確認 API Key 是否正確
- 檢查 API 配額是否足夠
- 查看終端錯誤訊息

## 除錯技巧

1. **查看終端輸出**：開發伺服器會顯示所有請求與錯誤
2. **檢查 MongoDB**：使用 `mongosh` 或 MongoDB Compass 查看資料
3. **LINE Webhook 日誌**：在 LINE Developers Console 查看 Webhook 請求記錄
4. **瀏覽器開發者工具**：在管理後台按 F12 查看網路請求

## 停止測試

1. 按 `Ctrl+C` 停止開發伺服器
2. 按 `Ctrl+C` 停止 ngrok
3. （可選）在 LINE Developers Console 關閉 Webhook

## 下一步

測試完成後，可以：
1. 部署到 Vercel（參考 `SETUP.md`）
2. 更新 LINE Webhook URL 為 Vercel 的 URL
3. 設定生產環境的環境變數

