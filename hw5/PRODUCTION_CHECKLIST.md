# 生產環境配置檢查清單

## 🌐 你的 Vercel 域名
```
https://wp1141hw5xclone-git-main-regchiangs-projects.vercel.app
```

## ✅ 代碼檢查結果

### 1. API 路由
- ✅ 所有 API 調用都使用相對路徑（`/api/...`）
- ✅ 沒有硬編碼的 localhost URL
- ✅ NextAuth redirect callback 使用環境變數 `baseUrl`

### 2. 前端路由
- ✅ 所有路由都是相對路徑
- ✅ 使用 Next.js 的 `useRouter` 進行導航

## 🔧 必須在 Vercel Dashboard 設置的環境變數

### 最重要：NEXTAUTH_URL
```
NEXTAUTH_URL=https://wp1141hw5xclone-git-main-regchiangs-projects.vercel.app
```

**注意**: 
- 必須以 `https://` 開頭
- 不要有結尾斜線 `/`
- 如果之後添加了自定義域名，記得更新這個值

## 🔗 OAuth 回調 URL 配置（必須更新）

### Google OAuth
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Credentials → 選擇你的 OAuth 2.0 Client ID
3. 在 **Authorized redirect URIs** 中添加：
   ```
   https://wp1141hw5xclone-git-main-regchiangs-projects.vercel.app/api/auth/callback/google
   ```
4. 點擊 **Save**

### GitHub OAuth
1. 前往 [GitHub Developer Settings](https://github.com/settings/developers)
2. OAuth Apps → 選擇你的 App → Edit
3. **Authorization callback URL** 設置為：
   ```
   https://wp1141hw5xclone-git-main-regchiangs-projects.vercel.app/api/auth/callback/github
   ```
4. **Homepage URL** 設置為：
   ```
   https://wp1141hw5xclone-git-main-regchiangs-projects.vercel.app
   ```
5. 點擊 **Update application**

### Facebook OAuth
1. 前往 [Facebook Developers](https://developers.facebook.com/)
2. 選擇你的 App → Settings → Basic
3. 在 **Valid OAuth Redirect URIs** 中添加：
   ```
   https://wp1141hw5xclone-git-main-regchiangs-projects.vercel.app/api/auth/callback/facebook
   ```
4. **Site URL** 設置為：
   ```
   https://wp1141hw5xclone-git-main-regchiangs-projects.vercel.app
   ```
5. 點擊 **Save Changes**

## 📋 完整環境變數清單

在 Vercel Dashboard → Settings → Environment Variables 中設置：

```
# 資料庫
DATABASE_URL=你的_postgresql_連接字串

# NextAuth（必須設置）
NEXTAUTH_URL=https://wp1141hw5xclone-git-main-regchiangs-projects.vercel.app
NEXTAUTH_SECRET=你的_secret_key（運行 openssl rand -base64 32 生成）

# Google OAuth
GOOGLE_CLIENT_ID=你的_google_client_id
GOOGLE_CLIENT_SECRET=你的_google_client_secret

# GitHub OAuth
GITHUB_ID=你的_github_client_id
GITHUB_SECRET=你的_github_client_secret

# Facebook OAuth
FACEBOOK_CLIENT_ID=你的_facebook_app_id
FACEBOOK_CLIENT_SECRET=你的_facebook_app_secret

# Pusher
PUSHER_APP_ID=你的_pusher_app_id
PUSHER_SECRET=你的_pusher_secret
NEXT_PUBLIC_PUSHER_KEY=你的_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=你的_pusher_cluster

# Admin (可選)
ADMIN_KEY=regp0o9i8u7
```

## ✅ 部署後測試清單

1. **訪問網站**
   - 打開 `https://wp1141hw5xclone-git-main-regchiangs-projects.vercel.app`
   - 確認頁面正常載入

2. **測試 OAuth 登入**
   - 嘗試使用 Google 登入
   - 嘗試使用 GitHub 登入
   - 嘗試使用 Facebook 登入
   - 如果失敗，檢查瀏覽器控制台的錯誤訊息

3. **測試基本功能**
   - 創建貼文
   - 留言
   - Like/Repost
   - 關注用戶
   - 查看通知

4. **檢查控制台**
   - 打開瀏覽器開發者工具（F12）
   - 查看 Console 標籤是否有錯誤
   - 查看 Network 標籤確認 API 請求是否成功

## 🐛 常見問題排查

### OAuth 登入失敗
**症狀**: 點擊 OAuth 按鈕後跳轉到錯誤頁面或顯示錯誤訊息

**解決方法**:
1. 確認 OAuth 回調 URL 已正確設置（見上方配置）
2. 檢查 Vercel 環境變數中的 OAuth 憑證是否正確
3. 確認 `NEXTAUTH_URL` 設置為完整的 HTTPS URL（沒有結尾斜線）
4. 檢查瀏覽器控制台的錯誤訊息

### 資料庫連接失敗
**症狀**: 頁面顯示錯誤或無法載入數據

**解決方法**:
1. 確認 `DATABASE_URL` 環境變數已設置
2. 檢查 Neon 資料庫連接字串是否正確
3. 確認資料庫允許外部連接（Neon 默認允許）

### 構建失敗
**症狀**: Vercel 部署失敗

**解決方法**:
1. 查看 Vercel Dashboard → Deployments → 失敗的部署 → Build Logs
2. 確認所有環境變數都已設置
3. 檢查是否有 TypeScript 錯誤（應該已經修復）

## 📝 注意事項

1. **不要提交 `.env` 文件**: 所有敏感資訊都通過 Vercel Dashboard 設置
2. **環境變數更新**: 更新環境變數後，Vercel 會自動重新部署
3. **自定義域名**: 如果之後添加了自定義域名，記得：
   - 更新 `NEXTAUTH_URL` 環境變數
   - 更新所有 OAuth 提供商的回調 URL

