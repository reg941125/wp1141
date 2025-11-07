# 📸 圖片上傳指南

## 🎯 重要概念

**圖片不應該存在資料庫中！** 應該：
- ✅ 圖片存在物件儲存服務（Object Storage）
- ✅ 資料庫只儲存圖片 URL
- ✅ 使用現有架構：PostgreSQL 存 URL 就夠了

## 🏆 推薦方案（依 Vercel 部署）

### 🥇 方案 1: Vercel Blob Storage（最推薦）
**最適合 Vercel 部署，無縫整合**

#### 優點：
- ✅ 完美整合 Vercel
- ✅ 免費額度 5GB 儲存 + 100GB 頻寬/月
- ✅ 自動 CDN
- ✅ 簡單易用
- ✅ 無需額外設定

#### 設定：
1. 安裝套件：
```bash
npm install @vercel/blob
```

2. 在 Vercel Dashboard → Storage → Blob → Create
3. 取得環境變數（自動設定）：
   - `BLOB_READ_WRITE_TOKEN`

#### 費用：
- 免費額度非常充足
- 超過後：$0.15/GB 儲存，$0.01/GB 頻寬

---

### 🥈 方案 2: Cloudinary（功能最強）
**自動圖片優化、轉換、CDN**

#### 優點：
- ✅ 自動圖片優化（壓縮、格式轉換）
- ✅ 免費額度：25GB 儲存 + 25GB 頻寬/月
- ✅ 強大的圖片變換功能（裁剪、縮放等）
- ✅ 自動 CDN
- ✅ 支援所有平台（不只 Vercel）

#### 設定：
1. 前往 [Cloudinary](https://cloudinary.com/) 註冊
2. 取得憑證：
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

3. 安裝套件：
```bash
npm install cloudinary
```

#### 費用：
- 免費額度：25GB/月（非常充足）
- 超過後：按使用量計費

---

### 🥉 方案 3: Supabase Storage（如果用 Supabase）
**如果你用 Supabase 做 PostgreSQL**

#### 優點：
- ✅ 與 Supabase 資料庫整合
- ✅ 免費額度：1GB 儲存 + 2GB 頻寬/月
- ✅ 簡單的 API

#### 缺點：
- ⚠️ 免費額度較少
- ⚠️ 需要 Supabase 專案

---

### 方案 4: AWS S3 + CloudFront（企業級）
**適合大規模應用**

#### 優點：
- ✅ 高度可擴展
- ✅ 業界標準
- ✅ 成本低（大量使用時）

#### 缺點：
- ⚠️ 設定較複雜
- ⚠️ 需要 AWS 帳號設定

---

## 💡 我的建議

### 對於你的專案：

1. **首選：Vercel Blob Storage**
   - 部署在 Vercel 的最佳選擇
   - 零設定、零費用（小專案）
   - 完美整合

2. **次選：Cloudinary**
   - 如果未來需要圖片優化功能
   - 更大免費額度
   - 不限定平台

3. **如果用 Supabase：Supabase Storage**
   - 方便管理
   - 與資料庫同平台

---

## 📊 資料庫選擇總結

### **不需要改變資料庫架構！**

- **PostgreSQL (Prisma)**: 繼續存 User 資料 + 圖片 URL
- **MongoDB**: 繼續存 Posts + 圖片 URL（如果貼文需要附圖）

圖片存在**物件儲存服務**，資料庫只存 URL。這是標準做法。

---

## 🚀 實作範例（Vercel Blob）

我會幫你實作圖片上傳功能，使用 Vercel Blob Storage。

### 功能包括：
1. ✅ 上傳頭像（Avatar）
2. ✅ 上傳背景圖（Cover Image）
3. ✅ 上傳貼文圖片（未來擴展）
4. ✅ 圖片預覽
5. ✅ 檔案大小限制
6. ✅ 檔案類型驗證

### 前端功能：
- 拖放上傳
- 圖片預覽
- 進度顯示
- 錯誤處理

---

## 📝 環境變數設定

### Vercel Blob:
```env
BLOB_READ_WRITE_TOKEN=你的 Vercel Blob Token（在 Vercel Dashboard 取得）
```

### Cloudinary:
```env
CLOUDINARY_CLOUD_NAME=你的 Cloud Name
CLOUDINARY_API_KEY=你的 API Key
CLOUDINARY_API_SECRET=你的 API Secret
```

---

## 💰 費用比較（小專案）

| 服務 | 免費額度 | 足夠嗎？ |
|-----|---------|---------|
| Vercel Blob | 5GB + 100GB/月 | ✅✅✅ 非常夠 |
| Cloudinary | 25GB + 25GB/月 | ✅✅ 夠 |
| Supabase Storage | 1GB + 2GB/月 | ⚠️ 可能不夠 |
| AWS S3 | 5GB/月 | ✅ 夠用 |

---

## 🎯 下一步

告訴我你選擇哪個方案，我會幫你：
1. 安裝必要套件
2. 建立圖片上傳 API
3. 更新前端元件
4. 測試功能

**我的建議：直接用 Vercel Blob，最簡單！**

