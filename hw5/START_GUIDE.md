# 🚀 X Clone 啟動指南

## 資料庫設定選項

你有兩個選擇來設定資料庫：

### 選項 1: 使用本地資料庫（需要安裝 PostgreSQL 和 MongoDB）

#### 1.1 安裝 PostgreSQL
- Windows: [下載 PostgreSQL](https://www.postgresql.org/download/windows/)
- 安裝後記住設定的密碼

#### 1.2 安裝 MongoDB
- Windows: [下載 MongoDB Community Server](https://www.mongodb.com/try/download/community)
- 或使用 MongoDB Compass 圖形介面

#### 1.3 修改 .env.local
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/xclone?schema=public"
MONGODB_URI="mongodb://localhost:27017/xclone"
```

### 選項 2: 使用雲端免費資料庫（推薦新手）

#### 2.1 PostgreSQL - 使用 Neon (免費)
1. 前往 [Neon](https://neon.tech/)
2. 註冊帳號，建立新專案
3. 複製連接字串，更新 `.env.local`:
```env
DATABASE_URL="postgresql://username:password@ep-xxx.region.aws.neon.tech/xclone?sslmode=require"
```

#### 2.2 MongoDB - 使用 MongoDB Atlas (免費)
1. 前往 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/)
2. 註冊帳號，建立免費 M0 cluster
3. 建立資料庫使用者
4. 允許 IP 0.0.0.0/0 (或你的 IP)
5. 複製連接字串，更新 `.env.local`:
```env
MONGODB_URI="mongodb+srv://username:password@cluster0.xxx.mongodb.net/xclone?retryWrites=true&w=majority"
```

---

## 🏃 啟動步驟

### 步驟 1: 確認資料庫設定完成
檢查 `.env.local` 中的 `DATABASE_URL` 和 `MONGODB_URI` 是否為有效的連接字串

### 步驟 2: 執行資料庫遷移
```bash
npx prisma migrate dev --name init
```
這會建立 PostgreSQL 的資料表結構

### 步驟 3: 啟動開發伺服器
```bash
npm run dev
```

### 步驟 4: 開啟瀏覽器
前往 [http://localhost:3000](http://localhost:3000)

---

## 🔍 測試 OAuth

1. 前往 `http://localhost:3000/auth/signin`
2. 點擊 Google/GitHub/Facebook 按鈕
3. 完成 OAuth 登入後，系統會自動建立帳號

---

## ⚠️ 常見問題

### 問題 1: DATABASE_URL 錯誤
**錯誤訊息**: `Environment variable not found: DATABASE_URL`

**解決方法**: 確認 `.env.local` 中的 `DATABASE_URL` 格式正確，且有設定資料庫密碼

### 問題 2: MongoDB 連接失敗
**錯誤訊息**: `MongooseServerSelectionError`

**解決方法**: 
- 確認 MongoDB 服務正在運行（本地）或連接字串正確（雲端）
- 檢查防火牆設定

### 問題 3: Prisma 遷移失敗
**錯誤訊息**: `Connection refused`

**解決方法**: 
- 確認 PostgreSQL 正在運行
- 檢查連接字串中的 host, port, username, password

---

## 💡 快速測試（不用 OAuth）

如果只想先測試基本功能，可以：

1. 使用 Credentials 登入：
   - 前往 `/auth/signup` 註冊新帳號（需要 userId + password）
   - 然後用 `/auth/signin` 登入

2. OAuth 設定可以之後再加

---

## 📝 完整的 .env.local 範例

```env
# Database (使用 Neon 範例)
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/xclone?sslmode=require"
MONGODB_URI="mongodb+srv://username:password@cluster0.xxx.mongodb.net/xclone?retryWrites=true&w=majority"

# NextAuth
NEXTAUTH_SECRET="wihTlUbhNe2yiYaHs/gfGn6O3EEIVEBarTF5X4BC10Q="
NEXTAUTH_URL="http://localhost:3000"

# OAuth - Google
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# OAuth - GitHub
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"

# OAuth - Facebook
FACEBOOK_CLIENT_ID="your-facebook-app-id"
FACEBOOK_CLIENT_SECRET="your-facebook-app-secret"

# Pusher (暫時可以先不放真實值)
PUSHER_APP_ID="your-pusher-app-id"
PUSHER_KEY="your-pusher-key"
PUSHER_SECRET="your-pusher-secret"
PUSHER_CLUSTER="ap1"
```

