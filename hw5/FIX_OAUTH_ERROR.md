# 🔧 修復 Google OAuth redirect_uri_mismatch 錯誤

## ❌ 錯誤訊息
```
錯誤 400: redirect_uri_mismatch
```

## 🔍 問題原因

Google Cloud Console 中設定的 **Authorized redirect URIs** 與 NextAuth 實際使用的 URI **不完全匹配**。

---

## ✅ 解決步驟

### Step 1: 確認你的 NEXTAUTH_URL

檢查 `.env.local` 中的 `NEXTAUTH_URL`：

**開發環境應該是：**
```env
NEXTAUTH_URL=http://localhost:3000
```

**如果部署到 Vercel，應該是：**
```env
NEXTAUTH_URL=https://your-app.vercel.app
```

---

### Step 2: 前往 Google Cloud Console

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇你的專案
3. 左側選單 → **API 和服務** → **憑證**
4. 找到你的 **OAuth 2.0 用戶端 ID**（用於 X_Clone）
5. 點擊編輯（鉛筆圖示）

---

### Step 3: 新增正確的 Redirect URI

在 **已授權的重新導向 URI** 區塊，**必須新增以下 URI**：

#### 開發環境：
```
http://localhost:3000/api/auth/callback/google
```

#### 如果已部署到 Vercel：
```
https://your-app-name.vercel.app/api/auth/callback/google
```

**⚠️ 重要注意事項：**

1. ✅ **必須完全一致**（包括 `http://` 或 `https://`）
2. ✅ **不能有尾隨斜線** `/` 
3. ✅ **大小寫敏感**
4. ✅ 可以同時有多個 URI（開發環境 + 生產環境）

---

### Step 4: 儲存並測試

1. 點擊 **儲存**

2. 等待幾秒讓變更生效（有時需要 1-2 分鐘）
3. 清除瀏覽器快取或使用無痕模式
4. 重新嘗試登入

---

## 🔍 常見錯誤

### ❌ 錯誤的 URI：
```
http://localhost:3000/api/auth/callback/google/  ← 多了斜線
http://localhost:3000/auth/callback/google      ← 少了 /api
localhost:3000/api/auth/callback/google          ← 少了 http://
HTTP://localhost:3000/api/auth/callback/google   ← 大小寫錯誤
```

### ✅ 正確的 URI：
```
http://localhost:3000/api/auth/callback/google
```

---

## 📝 完整檢查清單

- [ ] `.env.local` 中的 `NEXTAUTH_URL` 設定正確
- [ ] Google Cloud Console 中有新增 `/api/auth/callback/google` 結尾的 URI
- [ ] URI 完全匹配（包括協議、主機、路徑）
- [ ] 已儲存變更並等待生效
- [ ] 清除瀏覽器快取或使用無痕模式

---

## 🚀 如果還是失敗

### 方法 1: 檢查實際使用的 URI

在 NextAuth 的程式碼中，callback URL 格式是：
```
{NEXTAUTH_URL}/api/auth/callback/{provider}
```

確保 Google Cloud Console 中的 URI 符合這個格式。

### 方法 2: 檢查瀏覽器 Network

1. 開啟瀏覽器開發者工具（F12）
2. 前往 **Network** 分頁
3. 點擊 Google 登入按鈕
4. 查看失敗的請求，檢查實際的 `redirect_uri` 參數
5. 確保這個 URI 在 Google Cloud Console 中有設定

---

## 💡 同時支援開發和生產環境

如果你需要在本地和 Vercel 都能使用，在 Google Cloud Console 中同時新增：

```
http://localhost:3000/api/auth/callback/google
https://your-app-name.vercel.app/api/auth/callback/google
```

這樣兩個環境都能正常運作！

