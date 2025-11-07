# OAuth 設定指南

## Google OAuth 設定

### 1. 在 Google Cloud Console 建立專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 啟用 Google+ API

### 2. 建立 OAuth 2.0 憑證

1. 前往「憑證」頁面
2. 點擊「建立憑證」→「OAuth 用戶端 ID」
3. 選擇「網頁應用程式」
4. 輸入應用程式資訊：
   - **名稱**: X Clone (或任何名稱)
   
### 3. 設定 Redirect URIs

在 Google Cloud Console 的 OAuth 設定中，需要新增以下 **Authorized redirect URIs**:

#### 開發環境 (Development):
```
http://localhost:3000/api/auth/callback/google
```

#### 生產環境 (Production):
如果部署到 Vercel 或其他平台，新增：
```
https://your-domain.com/api/auth/callback/google
```

### 4. 取得憑證

- **用戶端 ID** (Client ID) → 填入 `.env.local` 的 `GOOGLE_CLIENT_ID`
- **用戶端密鑰** (Client Secret) → 填入 `.env.local` 的 `GOOGLE_CLIENT_SECRET`

---

## GitHub OAuth 設定

### 1. 在 GitHub 建立 OAuth App

1. 前往 [GitHub Developer Settings](https://github.com/settings/developers)
2. 點擊「OAuth Apps」→「New OAuth App」
3. 填寫資訊：
   - **Application name**: X Clone
   - **Homepage URL**: `http://localhost:3000` (開發) 或 `https://your-domain.com` (生產)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github` (開發) 或 `https://your-domain.com/api/auth/callback/github` (生產)

### 2. 取得憑證

- **Client ID** → 填入 `.env.local` 的 `GITHUB_ID`
- **Client Secret** → 填入 `.env.local` 的 `GITHUB_SECRET` (點擊 Generate a new client secret)

---

## Facebook OAuth 設定

### 1. 在 Facebook Developers 建立應用程式

1. 前往 [Facebook Developers](https://developers.facebook.com/)
2. 建立新應用程式
3. 新增「Facebook 登入」產品

### 2. 設定 OAuth Redirect URIs

在「設定」→「基本資料」中設定：

#### 有效的 OAuth 重新導向 URI:
開發環境：
```
http://localhost:3000/api/auth/callback/facebook
```

生產環境：
```
https://your-domain.com/api/auth/callback/facebook
```

### 3. 取得憑證

- **應用程式編號** (App ID) → 填入 `.env.local` 的 `FACEBOOK_CLIENT_ID`
- **應用程式密鑰** (App Secret) → 填入 `.env.local` 的 `FACEBOOK_CLIENT_SECRET`

---

## 注意事項

### NextAuth.js 的標準 Callback URLs

NextAuth.js 使用以下標準路徑：
- Google: `/api/auth/callback/google`
- GitHub: `/api/auth/callback/github`
- Facebook: `/api/auth/callback/facebook`

### 環境變數設定

確保 `.env.local` 包含：

```env
NEXTAUTH_URL=http://localhost:3000  # 開發環境
# 或
NEXTAUTH_URL=https://your-domain.com  # 生產環境

NEXTAUTH_SECRET=your-random-secret-key
```

**產生 NEXTAUTH_SECRET 的方法**:
```bash
openssl rand -base64 32
```

---

## 測試 OAuth

1. 設定完成後，啟動開發伺服器：
```bash
npm run dev
```

2. 前往 `http://localhost:3000/auth/signin`

3. 點擊 Google/GitHub/Facebook 按鈕進行測試

4. 首次登入會自動建立帳號

---

## 常見問題

### Redirect URI mismatch 錯誤

確保：
1. 在 OAuth 提供者的設定中，Callback URL 完全一致（包含協議 http/https）
2. NEXTAUTH_URL 環境變數設定正確
3. 大小寫敏感（URI 必須完全匹配）

### 本機測試建議

如果 OAuth 在本機無法運作，可以：
1. 先測試 Credentials 登入（userId + password）
2. OAuth 設定可在部署後再設定

