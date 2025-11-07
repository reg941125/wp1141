# Prisma P1002 錯誤解決方案

## 錯誤說明

P1002 錯誤表示：應用程式成功連接到資料庫伺服器，但在嘗試獲取 PostgreSQL 諮詢鎖時超時。

## 常見原因

1. **連接池配置問題** - Vercel 部署時需要使用連接池模式
2. **數據庫連接字符串格式錯誤** - 缺少必要的連接參數
3. **數據庫服務暫停** - Neon 免費版會自動暫停
4. **網絡延遲** - 應用與數據庫之間的網絡連接不穩定
5. **連接數限制** - 達到最大連接數限制

## 解決方案

### 1. 使用連接池（Neon/Vercel 推薦）

如果使用 **Neon** 或其他雲數據庫：

#### Neon 設置步驟：
1. 登入 [Neon Console](https://console.neon.tech)
2. 選擇你的專案
3. 點擊 **Connection Details**
4. 選擇 **Connection pooling** 模式（不是 Direct connection）
5. 選擇 **Transaction mode**
6. 複製連接字符串

#### 連接字符串格式：
```
postgresql://user:password@ep-xxx-pooler.us-east-1.aws.neon.tech/dbname?sslmode=require
```

**重要**：確保使用 `-pooler` 結尾的主機名，而不是直接連接。

### 2. 更新環境變數

在 Vercel Dashboard → Settings → Environment Variables 中：

```
DATABASE_URL=postgresql://user:password@ep-xxx-pooler.us-east-1.aws.neon.tech/dbname?sslmode=require&connection_limit=10&connect_timeout=10
```

### 3. 本地開發環境

在 `.env.local` 文件中：

```env
# 使用連接池模式（推薦）
DATABASE_URL="postgresql://user:password@ep-xxx-pooler.us-east-1.aws.neon.tech/dbname?sslmode=require&connection_limit=10&connect_timeout=10"

# 或使用直接連接（僅用於開發）
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require"
```

### 4. 檢查數據庫狀態

#### Neon：
- 免費版數據庫會自動暫停（5 分鐘無活動後）
- 首次連接時會自動喚醒（可能需要幾秒鐘）
- 如果持續失敗，手動在 Neon Console 中點擊 "Resume"

#### 其他 PostgreSQL 服務：
- 確認數據庫服務正在運行
- 檢查防火牆設置
- 確認 IP 白名單設置（如果需要）

### 5. 驗證連接

運行以下命令測試連接：

```bash
# 測試 Prisma 連接
npx prisma db pull

# 或運行遷移
npx prisma migrate deploy
```

### 6. Vercel 部署檢查清單

1. ✅ **環境變數已設置**
   - 在 Vercel Dashboard → Settings → Environment Variables
   - 確認 `DATABASE_URL` 已正確設置
   - 確認使用連接池模式的連接字符串

2. ✅ **連接字符串格式正確**
   - 包含 `-pooler` 主機名（Neon）
   - 包含 `sslmode=require`
   - 包含連接參數（`connection_limit`, `connect_timeout`）

3. ✅ **數據庫已激活**
   - Neon：確認數據庫未暫停
   - 其他服務：確認服務正在運行

4. ✅ **重新部署**
   - 更新環境變數後，重新部署專案
   - 查看 Vercel 構建日誌確認錯誤已解決

## 常見問題

### Q: 為什麼本地可以連接，但 Vercel 部署失敗？

A: 可能是因為：
- Vercel 環境變數未設置或設置錯誤
- 使用了直接連接而不是連接池
- 數據庫 IP 白名單限制（某些服務）

### Q: Neon 免費版連接不穩定？

A: Neon 免費版會自動暫停，建議：
- 使用連接池模式（更穩定）
- 首次連接時等待幾秒讓數據庫喚醒
- 考慮升級到付費計劃（如果預算允許）

### Q: 如何確認連接字符串是否正確？

A: 檢查連接字符串：
- ✅ 包含 `-pooler`（Neon 連接池）
- ✅ 包含 `sslmode=require`
- ✅ 主機名、用戶名、密碼正確
- ✅ 數據庫名稱正確

## 更新後的代碼

`lib/prisma.ts` 已更新，會自動添加連接池參數（如果未包含）。這有助於：
- 自動設置連接限制
- 設置連接超時
- 改善連接穩定性

## 如果問題仍然存在

1. 檢查 Vercel 構建日誌中的完整錯誤訊息
2. 確認數據庫服務狀態
3. 嘗試手動連接數據庫（使用 psql 或其他工具）
4. 聯繫數據庫服務提供商支持

