# 故障排除指南

## 500 Internal Server Error

如果 LINE Webhook 返回 500 錯誤，請按照以下步驟檢查：

### 1. 檢查環境變數

執行診斷腳本：
```bash
npm run test-webhook
```

或手動檢查 `.env.local` 檔案：
- `LINE_CHANNEL_ACCESS_TOKEN` 必須設定
- `LINE_CHANNEL_SECRET` 必須設定
- `GEMINI_API_KEY` 必須設定
- `MONGODB_URI` 必須設定

### 2. 檢查終端錯誤訊息

開發伺服器會顯示詳細的錯誤訊息。常見錯誤：

#### MongoDB 連線失敗
```
MongooseError: connect ECONNREFUSED
```
**解決方法：**
- 確認 MongoDB 服務正在運行
- 檢查 `MONGODB_URI` 是否正確
- 如果是 MongoDB Atlas，檢查 Network Access 設定

#### LINE SDK 初始化失敗
```
LINE Channel Access Token and Secret must be set
```
**解決方法：**
- 確認 `.env.local` 檔案存在
- 確認環境變數名稱正確
- 重新啟動開發伺服器

#### Gemini API 錯誤
```
Error generating event: ...
```
**解決方法：**
- 檢查 `GEMINI_API_KEY` 是否正確
- 確認 API 配額是否足夠
- 檢查網路連線

### 3. 檢查 Webhook URL

確認 LINE Webhook URL 設定正確：
- 本地測試：`https://你的-ngrok-url.ngrok-free.app/api/webhook`
- 或：`https://你的-ngrok-url.ngrok-free.app/api/line/webhook`

### 4. 檢查 ngrok

確認 ngrok 正在運行：
```bash
# 檢查 ngrok 狀態
curl http://localhost:4040/api/tunnels
```

如果 ngrok 未運行：
```bash
ngrok http 3000
```

### 5. 檢查開發伺服器

確認開發伺服器正在運行：
- 訪問 http://localhost:3000
- 應該能看到首頁或管理後台

### 6. 查看詳細日誌

改進後的錯誤處理會記錄詳細日誌：
- 檢查終端輸出
- 查找 `Error handling webhook event:` 訊息
- 查看完整的錯誤堆疊

### 7. 測試 Webhook Endpoint

使用 curl 測試 webhook：
```bash
curl -X GET https://你的-ngrok-url.ngrok-free.app/api/webhook
```

應該返回：
```json
{
  "message": "LINE Webhook endpoint is running"
}
```

## 常見錯誤訊息

### "Missing signature"
- LINE Webhook 請求沒有包含簽名
- 確認 Webhook URL 設定正確
- 確認 ngrok 正在運行

### "Invalid signature"
- LINE 簽名驗證失敗
- 確認 `LINE_CHANNEL_SECRET` 正確
- 確認環境變數已載入

### "LINE_CHANNEL_SECRET not configured"
- 環境變數未設定
- 確認 `.env.local` 檔案存在
- 重新啟動開發伺服器

### "Failed to parse webhook body"
- Webhook 請求格式錯誤
- 檢查 LINE Developers Console 的 Webhook 日誌

### "Database connection error"
- MongoDB 連線失敗
- 檢查 MongoDB 服務狀態
- 檢查 `MONGODB_URI` 設定

## 除錯技巧

### 1. 啟用詳細日誌

所有錯誤都會記錄到終端，包括：
- 錯誤訊息
- 錯誤堆疊
- 事件詳情

### 2. 檢查 LINE Webhook 日誌

在 LINE Developers Console：
1. 選擇你的 Channel
2. 前往 "Messaging API" > "Webhook"
3. 查看 "Webhook event log"

### 3. 測試個別功能

分別測試各個功能：
- 文字訊息
- Postback 事件
- 探索功能
- 狀態查詢

### 4. 檢查資料庫

使用 MongoDB Compass 或 mongosh：
```bash
mongosh
use line-rpg-bot
db.conversations.find().limit(5)
db.gamestates.find().limit(5)
```

## 仍然無法解決？

1. **檢查所有環境變數**：執行 `npm run test-webhook`
2. **查看完整錯誤日誌**：檢查終端輸出
3. **驗證 Webhook URL**：確認設定正確
4. **重新啟動服務**：重啟開發伺服器和 ngrok
5. **檢查 LINE Channel 設定**：確認 Channel 狀態正常

## 成功指標

當一切正常時，你應該看到：
- ✅ Webhook 驗證成功（在 LINE Developers Console）
- ✅ 終端顯示處理事件的日誌
- ✅ Bot 能夠回應訊息
- ✅ 管理後台顯示對話紀錄

