# 🔐 新的登入流程說明

## 📋 變更摘要

系統已修改為：
1. **只能使用 OAuth 註冊**（Google/GitHub/Facebook）
2. **OAuth 註冊後必須設定 userId**
3. **之後可以使用 userId 登入**（不需要密碼）

---

## 🚀 使用流程

### 首次註冊（OAuth）

1. 前往 `/auth/signin`
2. 點擊 **Google**、**GitHub** 或 **Facebook** 按鈕
3. 完成 OAuth 認證
4. 自動重定向到 `/auth/setup-userid`
5. 輸入你想要的 **User ID**（例如：ric2k1）
6. 點擊「完成註冊」
7. 自動登入並進入首頁

### 之後登入

#### 方式 1：使用 User ID 登入
1. 前往 `/auth/signin`
2. 輸入你的 **User ID**（不需要密碼）
3. 點擊「Sign in」
4. 進入首頁

#### 方式 2：使用 OAuth 登入
1. 前往 `/auth/signin`
2. 點擊 **Google**、**GitHub** 或 **Facebook** 按鈕
3. 完成 OAuth 認證
4. 自動登入（如果已設定過 userId）

---

## 🛠️ 技術細節

### 修改的檔案

1. **`app/api/auth/[...nextauth]/route.ts`**
   - Credentials Provider 改為只接受 userId（不需要密碼）
   - JWT callback 會從資料庫獲取 userId
   - 支援 OAuth 自動建立用戶

2. **`app/(auth)/auth/signin/page.tsx`**
   - 移除密碼欄位
   - 移除註冊連結
   - 只保留 User ID 輸入和 OAuth 按鈕

3. **`app/(auth)/auth/setup-userid/page.tsx`**（新建）
   - OAuth 首次登入後設定 userId 的頁面
   - 驗證 userId 格式（3-20 字符，字母數字底線連字號）
   - 檢查 userId 是否已被使用

4. **`app/api/auth/setup-userid/route.ts`**（新建）
   - API endpoint 用於設定 userId
   - 驗證並儲存 userId 到資料庫

5. **`app/(main)/home/page.tsx`**
   - 檢查用戶是否有 userId
   - 如果沒有，自動重定向到設定頁面

---

## ⚙️ User ID 規則

- **長度**：3-20 個字符
- **格式**：只能包含：
  - 英文字母（a-z, A-Z）
  - 數字（0-9）
  - 底線（_）
  - 連字號（-）
- **唯一性**：每個 userId 只能被使用一次
- **範例**：`ric2k1`, `user_123`, `john-doe`

---

## 🔒 安全性說明

### User ID 登入的安全性

雖然 User ID 登入不需要密碼，但有以下保護：

1. **必須先透過 OAuth 註冊**
   - 系統會檢查用戶是否已連結 OAuth 帳號
   - 沒有 OAuth 帳號的用戶無法使用 User ID 登入

2. **只有已註冊的用戶才能登入**
   - User ID 必須在資料庫中存在
   - 且該用戶必須有連結的 OAuth 帳號

3. **Session 管理**
   - 使用 NextAuth 的 JWT session
   - Session 有效期 30 天

---

## 📝 注意事項

1. **舊的註冊頁面**（`/auth/signup`）仍然存在，但不再使用
   - 可以選擇刪除或保留作為備用

2. **已存在的用戶**
   - 如果用戶透過舊流程註冊（有密碼），仍可使用 User ID 登入
   - 系統會檢查用戶是否有 OAuth 帳號連結

3. **OAuth 首次登入**
   - NextAuth 會自動建立用戶帳號
   - 但不會自動設定 userId
   - 必須手動設定 userId 才能繼續使用

---

## 🧪 測試建議

1. **測試 OAuth 註冊流程**
   - 使用全新的 Google/GitHub/Facebook 帳號
   - 確認會導向設定 userId 頁面
   - 設定 userId 後能正常登入

2. **測試 User ID 登入**
   - 使用已註冊的 userId 登入
   - 確認不需要密碼
   - 確認能正常進入首頁

3. **測試 OAuth 再次登入**
   - 使用已設定過 userId 的 OAuth 帳號登入
   - 確認直接進入首頁（不需要設定 userId）

4. **測試 User ID 格式驗證**
   - 嘗試輸入不符合格式的 userId
   - 確認會顯示錯誤訊息

---

## 🔄 如果需要恢復舊流程

如果之後想要恢復密碼登入，可以：

1. 恢復 `app/api/auth/[...nextauth]/route.ts` 中的 Credentials Provider
2. 恢復 `app/(auth)/auth/signin/page.tsx` 中的密碼欄位
3. 恢復註冊頁面的連結

但目前系統已完全改為 OAuth 註冊 + User ID 登入的方式。

