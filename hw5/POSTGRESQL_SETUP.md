# PostgreSQL/Neon 數據庫連接問題解決指南

## 問題診斷

如果您看到以下錯誤：
```
Can't reach database server at ep-nameless-feather-adbcq83b-pooler.c-2.us-east-1.aws.neon.tech:5432
```

這表示應用程式無法連接到 PostgreSQL 數據庫服務器。

## 常見原因和解決方案

### 1. Neon 數據庫暫停（最常見）

**免費版 Neon 數據庫會在閒置時自動暫停。**

**解決方法：**
1. 登入 [Neon Console](https://console.neon.tech/)
2. 選擇您的項目
3. 如果數據庫顯示為 "Paused" 狀態，點擊 **Resume** 或 **Restore** 按鈕
4. 等待幾秒鐘讓數據庫恢復運行
5. 重新啟動開發伺服器：
   ```bash
   npm run dev
   ```

### 2. DATABASE_URL 配置錯誤

**檢查步驟：**
1. 確認 `.env.local` 文件存在於專案根目錄
2. 確認 `DATABASE_URL` 變數已正確設定
3. 確認連接字串格式正確：

**Neon 連接字串格式：**
```
DATABASE_URL="postgresql://username:password@ep-xxx-xxx-pooler.us-east-1.aws.neon.tech/dbname?sslmode=require"
```

**本地 PostgreSQL 格式：**
```
DATABASE_URL="postgresql://user:password@localhost:5432/xclone?schema=public"
```

### 3. 檢查環境變數

確認 `.env.local` 中的 `DATABASE_URL` 正確：
```bash
# Windows PowerShell
cat .env.local | Select-String DATABASE_URL

# 或直接查看文件內容
```

### 4. 測試數據庫連接

可以使用 Prisma 命令測試連接：
```bash
npx prisma db pull
```

如果連接成功，會顯示數據庫結構。如果失敗，會顯示具體錯誤訊息。

### 5. 重新生成 Prisma Client

如果連接恢復後仍有問題，嘗試：
```bash
npx prisma generate
```

### 6. 檢查網絡連接

- 確認網絡連接正常
- 如果使用 VPN，嘗試關閉 VPN 後重試
- 確認防火牆沒有阻擋數據庫連接

## 快速檢查清單

- [ ] Neon 數據庫是否已激活（非暫停狀態）
- [ ] `.env.local` 中的 `DATABASE_URL` 是否正確
- [ ] 數據庫服務器是否正在運行
- [ ] 網絡連接是否正常
- [ ] 重新啟動開發伺服器
- [ ] 運行 `npx prisma generate` 重新生成客戶端

## 預防措施

### 避免 Neon 免費版自動暫停

1. **使用 Neon Pro 計劃**（付費版不會自動暫停）
2. **定期訪問數據庫**（保持活動狀態）
3. **使用連接池**（Neon 提供連接池功能）

### 使用連接池 URL

Neon 提供兩種連接 URL：
- **Direct connection**：直接連接（會暫停）
- **Pooler connection**：連接池（更穩定）

確保使用 Pooler 連接 URL（URL 中包含 `-pooler`）。

## 如果問題持續存在

1. **檢查 Neon Dashboard**：
   - 查看數據庫狀態
   - 查看連接日誌
   - 確認是否有配額限制

2. **檢查 Prisma 連接**：
   ```bash
   npx prisma db pull
   ```

3. **查看詳細錯誤日誌**：
   檢查終端機的完整錯誤訊息

4. **嘗試重新創建數據庫**：
   如果數據庫損壞，可能需要重新創建

## 聯繫支援

如果以上方法都無法解決問題，請：
1. 檢查 [Neon Status Page](https://status.neon.tech/)
2. 查看 [Neon 文檔](https://neon.tech/docs)
3. 聯繫 Neon 支援團隊


