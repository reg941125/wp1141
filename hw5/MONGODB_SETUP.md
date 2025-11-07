# MongoDB Atlas 設定指南

## IP 白名單問題解決方案

如果您遇到以下錯誤：
```
MongooseServerSelectionError: Could not connect to any servers in your MongoDB Atlas cluster. 
One common reason is that you're trying to access the database from an IP that isn't whitelisted.
```

## 解決步驟

### 方法 1：將您的 IP 加入白名單（推薦）

1. 登入 [MongoDB Atlas Dashboard](https://cloud.mongodb.com/)
2. 選擇您的 Cluster
3. 點擊左側選單的 **Network Access**
4. 點擊 **Add IP Address**
5. 選擇以下其中一個選項：
   - **Add Current IP Address**：自動加入您當前的 IP
   - **Allow Access from Anywhere**：暫時允許所有 IP（輸入 `0.0.0.0/0`）
6. 點擊 **Confirm**
7. 等待幾分鐘讓設定生效

### 方法 2：檢查 MongoDB URI 格式

確保您的 `.env.local` 中的 `MONGODB_URI` 格式正確：

**Atlas 連接字串格式：**
```
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<database-name>?retryWrites=true&w=majority"
```

**本地 MongoDB 格式：**
```
MONGODB_URI="mongodb://localhost:27017/xclone"
```

### 方法 3：確認環境變數

1. 確認 `.env.local` 檔案存在於專案根目錄
2. 確認 `MONGODB_URI` 變數已正確設定
3. 重新啟動開發伺服器：
   ```bash
   npm run dev
   ```

### 方法 4：檢查 MongoDB Atlas Cluster 狀態

1. 確認您的 Cluster 處於 **Running** 狀態
2. 確認 Cluster 沒有暫停或刪除
3. 檢查是否有額外的安全設定（如 VPC Peering）需要配置

## 常見問題

### Q: 我已經加入 IP 了，為什麼還是連不上？
A: 
- IP 白名單變更需要幾分鐘才會生效
- 確認您使用的是正確的 IP 地址（可以訪問 https://whatismyipaddress.com/ 查看）
- 如果使用 VPN，請確認 VPN 的 IP 已被加入白名單

### Q: 可以在開發環境允許所有 IP 嗎？
A: 可以，但**僅限於開發環境**。在生產環境中應只允許特定 IP。

### Q: 如何查看當前的連接狀態？
A: 檢查終端機的錯誤訊息，或查看 MongoDB Atlas Dashboard 的 **Logs** 頁面。

## 測試連接

修改設定後，重新啟動開發伺服器並測試 API 請求：

```bash
npm run dev
```

然後訪問：
- `http://localhost:3000/api/posts` (需要登入)
- `http://localhost:3000/api/users/[userId]/posts` (需要登入)

如果連接成功，應該不會再看到 MongoDB 連接錯誤。



