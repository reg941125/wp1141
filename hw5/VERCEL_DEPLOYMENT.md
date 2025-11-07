# Vercel 部署指南

## 環境變數設置

在 Vercel 部署時，需要在 Vercel Dashboard 中設置環境變數。以下是詳細步驟：

### 1. 登入 Vercel Dashboard
- 前往 [https://vercel.com](https://vercel.com)
- 使用 GitHub 帳號登入

### 2. 導入專案
- 點擊 "Add New Project"
- 選擇你的 GitHub repository
- 點擊 "Import"

### 3. 設置環境變數
在專案設置頁面中：
1. 點擊 "Settings" 標籤
2. 點擊左側選單的 "Environment Variables"
3. 添加以下環境變數：

#### 資料庫
```
DATABASE_URL=your_postgresql_connection_string
```
**注意**: 使用 Neon 或其他 PostgreSQL 服務的連接字串

#### NextAuth
```
NEXTAUTH_URL=https://wp1141hw5xclone-git-main-regchiangs-projects.vercel.app
NEXTAUTH_SECRET=your_nextauth_secret_key
```
**生成 NEXTAUTH_SECRET**: 
```bash
openssl rand -base64 32
```

**重要**: 如果你的 Vercel 專案有自定義域名，請使用自定義域名。否則使用 Vercel 提供的預設域名。

#### OAuth Providers

**Google**:
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

**GitHub**:
```
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret
```

**Facebook**:
```
FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret
```

#### Pusher (即時通知)
```
PUSHER_APP_ID=your_pusher_app_id
PUSHER_SECRET=your_pusher_secret
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_pusher_cluster
```

#### Admin Key (可選)
```
ADMIN_KEY=regp0o9i8u7
```

### 4. 設置環境變數的環境
對於每個環境變數，選擇適用的環境：
- **Production**: 生產環境
- **Preview**: 預覽環境（PR 等）
- **Development**: 開發環境

建議：所有環境變數都設置為適用於所有環境。

### 5. 部署
設置完環境變數後：
1. 點擊 "Deploy" 按鈕
2. Vercel 會自動構建和部署你的應用
3. 構建完成後，你會獲得一個部署 URL

### 6. 資料庫遷移
首次部署時，Vercel 會自動運行 `prisma migrate deploy`（在 `vercel.json` 中配置）。

如果遷移失敗，你可以：
1. 在 Vercel Dashboard 的 "Deployments" 標籤中找到失敗的部署
2. 查看構建日誌
3. 或手動運行遷移（需要訪問資料庫）

## 重要提示

1. **不要提交 `.env` 文件**: `.env` 文件已被 `.gitignore` 忽略
2. **環境變數名稱**: 確保環境變數名稱與代碼中使用的一致
3. **NEXTAUTH_URL**: 必須設置為 `https://wp1141hw5xclone-git-main-regchiangs-projects.vercel.app`
4. **資料庫連接**: 確保 PostgreSQL 資料庫允許來自 Vercel IP 的連接
5. **OAuth 回調 URL**: 在 OAuth 提供商的設置中添加以下回調 URL：

### OAuth 回調 URL 配置

#### Google OAuth
在 [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → 你的 OAuth 2.0 Client ID

**Authorized redirect URIs** 添加：
```
https://wp1141hw5xclone-git-main-regchiangs-projects.vercel.app/api/auth/callback/google
```

#### GitHub OAuth
在 [GitHub Developer Settings](https://github.com/settings/developers) → OAuth Apps → 你的 App

**Authorization callback URL**:
```
https://wp1141hw5xclone-git-main-regchiangs-projects.vercel.app/api/auth/callback/github
```

**Homepage URL**:
```
https://wp1141hw5xclone-git-main-regchiangs-projects.vercel.app
```

#### Facebook OAuth
在 [Facebook Developers](https://developers.facebook.com/) → 你的 App → Settings → Basic

**Valid OAuth Redirect URIs**:
```
https://wp1141hw5xclone-git-main-regchiangs-projects.vercel.app/api/auth/callback/facebook
```

**Site URL**:
```
https://wp1141hw5xclone-git-main-regchiangs-projects.vercel.app
```

## 故障排除

### 構建失敗
- 檢查環境變數是否正確設置
- 查看構建日誌中的錯誤訊息
- 確保所有依賴都已安裝

### 資料庫連接失敗
- 檢查 `DATABASE_URL` 是否正確
- 確認資料庫允許外部連接
- 檢查資料庫服務是否運行

### OAuth 登入失敗
- 確認 OAuth 回調 URL 已設置為 Vercel URL
- 檢查 OAuth 憑證是否正確
- 查看瀏覽器控制台的錯誤訊息


