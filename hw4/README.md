# NTU 廁所地圖 - 全端網頁應用程式

一個專為台灣大學及周邊地區設計的廁所地圖應用程式，讓用戶可以找到、新增、評分和分享廁所資訊。

## 🚀 功能特色

### 核心功能
- 🗺️ **互動式地圖**：使用 Google Maps 顯示廁所位置
- 🔍 **智能搜尋**：根據位置、評分、標籤篩選廁所
- ➕ **新增廁所**：用戶可以新增新的廁所資訊
- ⭐ **評分系統**：1-5 星評分和評論功能
- 🏷️ **標籤系統**：免治馬桶、無障礙設施、24小時開放等標籤
- 👥 **好友系統**：添加好友、查看好友動態
- 📱 **響應式設計**：支援手機、平板、桌面裝置

### 技術特色
- **前端**：React + TypeScript + Material UI
- **後端**：Node.js + Express + TypeScript
- **資料庫**：SQLite
- **地圖服務**：Google Maps API
- **認證**：JWT Token
- **檔案上傳**：支援廁所照片

## 🛠️ 技術架構

### 前端技術
- **React 18** - 現代化 UI 框架
- **TypeScript** - 型別安全
- **Material UI** - 美觀的 UI 組件庫
- **React Router** - 路由管理
- **Axios** - HTTP 請求
- **Google Maps JavaScript API** - 地圖功能

### 後端技術
- **Node.js** - JavaScript 運行環境
- **Express** - Web 框架
- **TypeScript** - 型別安全
- **SQLite** - 輕量級資料庫
- **JWT** - 身份驗證
- **bcryptjs** - 密碼加密
- **multer** - 檔案上傳
- **Google Maps Services** - 地理編碼

## 📁 專案結構

```
hw4/
├── backend/                 # 後端 API
│   ├── src/
│   │   ├── config/         # 資料庫和環境配置
│   │   ├── controllers/    # API 控制器
│   │   ├── middleware/     # 中間件
│   │   ├── models/         # 資料庫模型
│   │   ├── routes/         # API 路由
│   │   ├── services/       # 外部服務
│   │   ├── types/          # TypeScript 型別
│   │   └── server.ts       # 伺服器入口
│   ├── uploads/            # 上傳檔案目錄
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # 前端應用
│   ├── src/
│   │   ├── components/     # React 組件
│   │   ├── contexts/       # React Context
│   │   ├── pages/          # 頁面組件
│   │   ├── services/       # API 服務
│   │   ├── types/          # TypeScript 型別
│   │   └── App.tsx         # 應用程式入口
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## 🚀 快速開始

### 環境需求
- Node.js 18+ 
- npm 或 yarn
- Google Maps API Key

### 1. 安裝依賴

#### 後端
```bash
cd backend
npm install
```

#### 前端
```bash
cd frontend
npm install
```

### 2. 環境變數設定

#### 後端 (.env)
```env
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-here
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
DATABASE_PATH=./database.sqlite
NODE_ENV=development
```

#### 前端 (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### 3. 啟動應用程式

#### 啟動後端
```bash
cd backend
npm run dev
```

#### 啟動前端
```bash
cd frontend
npm run dev
```

### 4. 訪問應用程式
- 前端：http://localhost:5173
- 後端 API：http://localhost:5000

## 📊 資料庫結構

### 主要表格
- **users** - 用戶資訊
- **restrooms** - 廁所資訊
- **tags** - 標籤系統
- **restroom_tags** - 廁所標籤關聯
- **comments** - 評論和評分
- **friendships** - 好友關係

## 🔧 API 端點

### 認證
- `POST /api/auth/register` - 註冊
- `POST /api/auth/login` - 登入
- `POST /api/auth/logout` - 登出

### 廁所
- `GET /api/restrooms` - 取得所有廁所
- `POST /api/restrooms` - 新增廁所
- `GET /api/restrooms/:id` - 取得特定廁所
- `PUT /api/restrooms/:id` - 更新廁所
- `DELETE /api/restrooms/:id` - 刪除廁所
- `GET /api/restrooms/nearest` - 找最近的廁所

### 評論
- `POST /api/comments/restrooms/:restroom_id/comments` - 新增評論
- `GET /api/comments/restrooms/:restroom_id/comments` - 取得廁所評論
- `PUT /api/comments/:id` - 更新評論
- `DELETE /api/comments/:id` - 刪除評論

### 好友系統
- `POST /api/friends/send-request` - 發送好友請求
- `POST /api/friends/accept-request` - 接受好友請求
- `POST /api/friends/reject-request` - 拒絕好友請求
- `GET /api/friends/` - 取得好友列表
- `GET /api/friends/requests` - 取得好友請求
- `GET /api/friends/activity` - 取得好友動態

## 🎨 主要頁面

### 1. 首頁
- 應用程式介紹
- 登入/註冊功能

### 2. 地圖頁面
- Google Maps 整合
- 廁所標記顯示
- 篩選面板
- 新增廁所按鈕

### 3. 廁所詳情
- 廁所詳細資訊
- 評分和評論
- 照片展示
- 標籤顯示

### 4. 新增廁所
- 表單填寫
- 標籤選擇
- 照片上傳

### 5. 好友系統
- 好友列表
- 好友請求管理
- 好友動態

## 🔐 安全功能

- JWT Token 認證
- 密碼加密 (bcrypt)
- 輸入驗證
- SQL 注入防護
- CORS 設定

## 📱 響應式設計

- 手機優先設計
- 平板適配
- 桌面優化
- Material UI 組件

## 🚀 部署建議

### 後端部署
1. 使用 PM2 管理進程
2. 設定 Nginx 反向代理
3. 使用 HTTPS
4. 定期備份資料庫

### 前端部署
1. 使用 Vite 建置
2. 部署到 CDN
3. 設定環境變數
4. 啟用 Gzip 壓縮

## 🤝 貢獻指南

1. Fork 專案
2. 建立功能分支
3. 提交變更
4. 發送 Pull Request

## 📄 授權

MIT License

## 📞 聯絡資訊

如有問題或建議，請聯繫開發團隊。

---

**注意**：使用前請確保已設定正確的 Google Maps API Key 和環境變數。