# 🚀 Vercel 部署指南

## 資料庫選擇建議

對於 Vercel 部署，**強烈推薦使用雲端資料庫服務**，因為它們提供：
- ✅ 免費額度
- ✅ 自動備份
- ✅ 全球 CDN
- ✅ 易於擴展
- ✅ 無需管理伺服器

---

## 📊 資料庫組合推薦

### 🥇 方案 1: Supabase (PostgreSQL) + MongoDB Atlas
**最推薦！新手友善**

#### Supabase 設定（PostgreSQL）
1. 前往 [Supabase](https://supabase.com/) 註冊
2. 建立新專案，選擇地區（建議選離台灣最近的）
3. 取得連接字串：
   - Settings → Database → Connection string
   - 選擇 `Connection pooling` → `Transaction mode`
4. 複製連接字串，格式類似：
```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-ID].supabase.co:6543/postgres?pgbouncer=true
```

#### MongoDB Atlas 設定
1. 前往 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. 建立免費 M0 Cluster
3. 建立資料庫使用者
4. Network Access → Add IP → 允許 `0.0.0.0/0`（所有 IP）
5. Database → Connect → Connect your application
6. 複製連接字串

**優點**:
- Supabase 免費額度 500MB PostgreSQL + 2GB 頻寬
- MongoDB Atlas 免費額度 512MB
- Supabase 有圖形化管理介面
- 兩個都有自動備份

---

### 🥈 方案 2: Neon (PostgreSQL) + MongoDB Atlas
**更接近標準 PostgreSQL**

#### Neon 設定
1. 前往 [Neon](https://neon.tech/) 註冊
2. 建立新專案
3. 取得連接字串，格式：
```
postgresql://[username]:[password]@[endpoint].cloud.neon.tech/[dbname]?sslmode=require
```

**優點**:
- Neon 專門做 PostgreSQL
- 有 Branching 功能（類似 git）
- 免費額度 3GB

---

### 🥉 方案 3: Railway (PostgreSQL + MongoDB)
**All-in-one 解決方案**

1. 前往 [Railway](https://railway.app/)
2. 建立專案，新增 PostgreSQL 和 MongoDB
3. 取得連接字串

**優點**:
- 一次管理兩個資料庫
- 免費額度 $5/月
- 自動 HTTPS

---

## 🔧 Vercel 環境變數設定

### 步驟 1: 部署到 Vercel
```bash
# 如果還沒安裝 Vercel CLI
npm i -g vercel

# 在專案目錄執行
vercel
```

或直接：
1. Push 到 GitHub
2. 在 [Vercel Dashboard](https://vercel.com/dashboard) Import Project
3. 連接 GitHub repository

### 步驟 2: 設定環境變數
在 Vercel Dashboard → Your Project → Settings → Environment Variables

新增以下變數：

```env
# Database
DATABASE_URL=postgresql://... (從 Supabase/Neon 取得)
MONGODB_URI=mongodb+srv://... (從 MongoDB Atlas 取得)

# NextAuth
NEXTAUTH_SECRET=產生隨機字串 (openssl rand -base64 32)
NEXTAUTH_URL=https://your-app.vercel.app

# OAuth - Google
GOOGLE_CLIENT_ID=你的 Google Client ID
GOOGLE_CLIENT_SECRET=你的 Google Client Secret

# OAuth - GitHub  
GITHUB_ID=你的 GitHub Client ID
GITHUB_SECRET=你的 GitHub Client Secret

# OAuth - Facebook
FACEBOOK_CLIENT_ID=你的 Facebook App ID
FACEBOOK_CLIENT_SECRET=你的 Facebook App Secret

# Pusher
PUSHER_APP_ID=你的 Pusher App ID
PUSHER_KEY=你的 Pusher Key
PUSHER_SECRET=你的 Pusher Secret
PUSHER_CLUSTER=ap1
```

⚠️ **重要**: 每個環境都要設定一次（Production, Preview, Development）

### 步驟 3: 執行資料庫遷移
```bash
# 在本地執行，使用生產環境變數
npx prisma migrate deploy

# 或在 Vercel CLI 執行
vercel env pull  # 先拉取環境變數到本地 .env.local
npx prisma migrate deploy
```

---

## 🌐 更新 OAuth Redirect URIs

部署到 Vercel 後，**必須**更新所有 OAuth 的 Redirect URIs：

### Google
- Production URL: `https://your-app.vercel.app/api/auth/callback/google`
- Preview URLs (可選): `https://*-your-app.vercel.app/api/auth/callback/google`

### GitHub
- Authorization callback URL: `https://your-app.vercel.app/api/auth/callback/github`

### Facebook
- 有效的 OAuth 重新導向 URI: `https://your-app.vercel.app/api/auth/callback/facebook`

---

## 📦 額外設定

### PostgreSQL 連接池
對於 Serverless 環境（如 Vercel），建議使用連接池：

**Supabase**:
```env
DATABASE_URL=postgresql://...?pgbouncer=true
```

**Neon**:
```env
DATABASE_URL=postgresql://...?connection_limit=1&connect_timeout=10
```

### Prisma Schema 優化
檢查 `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // 對 Serverless 環境很重要！
  directUrl = env("DIRECT_URL") // 可選，用於 migrations
}
```

---

## 🚀 完整部署流程

### 1. 本地準備
```bash
# 確認專案可以運行
npm run build
npm run dev  # 測試本地運行

# 提交到 Git
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Vercel 部署
```bash
# 方式 A: 使用 Vercel CLI
vercel

# 方式 B: 使用 GitHub 自動部署
# Push 到 GitHub，Vercel 會自動偵測並部署
```

### 3. 設定生產環境
1. 在 Vercel Dashboard 設定環境變數
2. 更新 OAuth Redirect URIs
3. 執行資料庫遷移
4. Redeploy 確保環境變數生效

### 4. 驗證
```bash
# 訪問生產 URL
https://your-app.vercel.app

# 測試登入流程
https://your-app.vercel.app/auth/signin
```

---

## 🔍 除錯建議

### 問題 1: Database connection error
**檢查**:
- 環境變數是否正確設定
- 資料庫是否允許 Vercel 的 IP（MongoDB Atlas）
- 連接字串格式是否正確

### 問題 2: Prisma 遷移失敗
**解決**:
```bash
# 使用 push 而不是 migrate（開發環境）
npx prisma db push

# 或使用 migrate deploy（生產環境）
npx prisma migrate deploy
```

### 問題 3: OAuth 重定向錯誤
**檢查**:
- Redirect URI 必須完全匹配（包括 `https://`）
- 大小寫敏感
- 沒有多餘的空格

---

## 💰 費用預估

| 服務 | 免費額度 | 足夠嗎？ |
|-----|---------|---------|
| Vercel | 無限（Hobby Plan） | ✅ 非常足夠 |
| Supabase | 500MB DB + 2GB 頻寬 | ✅ 小專案足夠 |
| Neon | 3GB DB | ✅ 夠用 |
| MongoDB Atlas | 512MB | ✅ 夠用 |
| Pusher | 100 連線數/200k 訊息/天 | ⚠️ 可能需要升級 |

**總計**: 每月 $0 🎉

---

## 📚 推薦資源

- [Vercel 文檔](https://vercel.com/docs)
- [Supabase 文檔](https://supabase.com/docs)
- [Neon 文檔](https://neon.tech/docs)
- [MongoDB Atlas 文檔](https://docs.atlas.mongodb.com/)
- [NextAuth.js 部署指南](https://next-auth.js.org/deployment)

