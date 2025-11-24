# Vercel 部署指南

## 📋 部署前檢查清單

### ✅ 1. 環境變數設定

在 Vercel 專案設定中，添加以下環境變數：

```
LINE_CHANNEL_ACCESS_TOKEN=你的_LINE_Channel_Access_Token
LINE_CHANNEL_SECRET=你的_LINE_Channel_Secret
GEMINI_API_KEY=你的_Gemini_API_Key
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/line-rpg-bot
```

**重要：**
- `MONGODB_URI` 必須使用 MongoDB Atlas（雲端），不能使用 `localhost`
- 確保 MongoDB Atlas 的 Network Access 允許 Vercel 的 IP（或設定為 `0.0.0.0/0` 允許所有 IP）

### ✅ 2. 設定步驟

1. **推送代碼到 GitHub**
   ```bash
   git add .
   git commit -m "準備部署到 Vercel"
   git push origin main
   ```

2. **在 Vercel 中導入專案**
   - 前往 https://vercel.com
   - 點擊 "New Project"
   - 選擇你的 GitHub 倉庫
   - 選擇專案

3. **設定環境變數**
   - 在專案設定中找到 "Environment Variables"
   - 添加上述所有環境變數
   - 確保選擇正確的環境（Production, Preview, Development）

4. **設定構建配置**
   - Framework Preset: Next.js（應該自動偵測）
   - Build Command: `npm run build`（預設）
   - Output Directory: `.next`（預設）
   - Install Command: `npm install`（預設）

5. **部署**
   - 點擊 "Deploy"
   - 等待構建完成

### ✅ 3. 部署後設定

1. **取得 Vercel URL**
   - 部署完成後，你會得到一個 URL，例如：`https://your-app.vercel.app`

2. **更新 LINE Webhook URL**
   - 前往 [LINE Developers Console](https://developers.line.biz/console/)
   - 選擇你的 Channel
   - 在 "Messaging API" 區塊找到 "Webhook settings"
   - 設定 Webhook URL 為：
     ```
     https://your-app.vercel.app/api/webhook
     ```
     或
     ```
     https://your-app.vercel.app/api/line/webhook
     ```
   - 點擊 "Verify" 驗證 Webhook
   - 確保 "Use webhook" 已啟用

3. **測試 Bot**
   - 在 LINE 中發送訊息給你的 Bot
   - 確認 Bot 能正常回應

### ✅ 4. 檢查清單

- [ ] 所有環境變數已設定
- [ ] MongoDB Atlas 已設定並允許 Vercel IP
- [ ] 代碼已推送到 GitHub
- [ ] Vercel 專案已創建並連接 GitHub
- [ ] 構建成功完成
- [ ] LINE Webhook URL 已更新為 Vercel URL
- [ ] Webhook 驗證成功
- [ ] Bot 測試正常

## 🔧 常見問題

### 構建失敗

**錯誤：找不到模組**
- 確保 `package.json` 中所有依賴都已列出
- 運行 `npm install` 確保依賴正確安裝

**錯誤：TypeScript 錯誤**
- 檢查是否有 TypeScript 錯誤
- 運行 `npm run build` 本地測試構建

### 運行時錯誤

**MongoDB 連線失敗**
- 確認 `MONGODB_URI` 使用 MongoDB Atlas（不是 localhost）
- 檢查 MongoDB Atlas Network Access 設定
- 確認用戶名和密碼正確

**LINE Webhook 驗證失敗**
- 確認 Webhook URL 正確（必須是 HTTPS）
- 確認環境變數 `LINE_CHANNEL_SECRET` 正確
- 檢查 Vercel 函數日誌

**Gemini API 錯誤**
- 確認 `GEMINI_API_KEY` 正確
- 檢查 API 配額是否足夠

### 函數超時

如果遇到函數超時錯誤：
- 檢查 `vercel.json` 中的 `maxDuration` 設定
- 對於需要較長時間的操作（如 LLM 調用），已設定為 30 秒

## 📊 監控和日誌

1. **查看 Vercel 日誌**
   - 在 Vercel Dashboard 中選擇你的專案
   - 點擊 "Functions" 標籤
   - 查看函數執行日誌

2. **查看構建日誌**
   - 在 "Deployments" 標籤中查看構建日誌
   - 檢查是否有警告或錯誤

## 🔄 更新部署

當你需要更新代碼時：
1. 推送更改到 GitHub
2. Vercel 會自動觸發新的部署
3. 等待部署完成
4. 測試 Bot 功能

## 📝 注意事項

- Vercel 免費方案有函數執行時間限制（10 秒，Hobby 方案為 60 秒）
- 確保 MongoDB Atlas 免費方案有足夠的配額
- LINE Bot 有 API 調用限制，注意不要超過配額
- Gemini API 有配額限制，注意使用量

