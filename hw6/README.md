# LINE RPG Bot System

一個整合 Gemini API 的 LINE Bot RPG 遊戲系統，使用 Next.js + TypeScript 開發。  
Bot Id: @175jtxwa    
Deploy Link: https://wp1141hw6linebot.vercel.app/  
除了可使用探索進行隨機的探索事件，也可以直接跟 Bot 進行對話，Bot 會根據對話內容生成相應的回應。  
例如：  
我想戰鬥 -> Bot 會生成相應的戰鬥事件，並且玩家可以選擇戰鬥或逃跑。  
我想打鍾心哲 -> Bot 會生成跟鍾心哲有關的對話內容。  

## 功能特色

- 🎮 RPG 遊戲系統：玩家扮演冒險者，探索世界、戰鬥、收集寶物
- 🤖 AI 事件生成：使用 Gemini API 動態生成遊戲事件
- 💬 LINE Bot 整合：完整的 LINE Messaging API 整合
- 📊 管理後台：監控對話、檢視統計、管理歷程
- 🗄️ 資料持久化：使用 MongoDB 儲存對話與遊戲狀態
- ⚡ 錯誤處理：完善的錯誤處理與降級機制
- 🚦 Rate Limiting：防止 API 濫用

## 技術架構

- **框架**: Next.js 14+ (App Router) with TypeScript
- **部署**: Vercel
- **資料庫**: MongoDB (使用 Mongoose)
- **LLM**: Google Gemini API
- **LINE SDK**: @line/bot-sdk

## 環境變數設定

建立 `.env.local` 檔案並設定以下環境變數：

```env
# LINE Bot Configuration
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret

# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/line-rpg-bot
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/line-rpg-bot

# Application Configuration
NODE_ENV=development
```

## LINE Bot 設定步驟

### 1. 建立 LINE 官方帳號

1. 前往 [LINE Developers](https://developers.line.biz/)
2. 登入你的 LINE 帳號
3. 建立新的 Provider（如果還沒有）
4. 建立新的 Channel，選擇 "Messaging API"
5. 記下 Channel Access Token 和 Channel Secret

### 2. 設定 Webhook URL

1. 在 Channel 設定頁面找到 "Webhook settings"
2. 設定 Webhook URL 為：`https://your-domain.vercel.app/api/webhook`
3. 啟用 Webhook
4. 驗證 Webhook（點擊 "Verify" 按鈕）

### 3. 設定環境變數

將 LINE Channel Access Token 和 Channel Secret 設定到 Vercel 環境變數中。

## 本地開發

### 安裝依賴

```bash
npm install
```

### 啟動開發伺服器

```bash
npm run dev
```

### 測試 Webhook（本地）

使用 ngrok 或其他工具將本地伺服器暴露到公網：

```bash
ngrok http 3000
```

然後將 ngrok 提供的 URL 設定到 LINE Webhook URL。

## 部署到 Vercel

### 1. 準備專案

確保所有檔案都已提交到 Git repository。

### 2. 連接到 Vercel

1. 前往 [Vercel](https://vercel.com/)
2. 匯入你的 Git repository
3. 設定環境變數（參考上面的環境變數設定）
4. 部署

### 3. 設定 Webhook URL

部署完成後，將 Vercel 提供的 URL 設定到 LINE Webhook URL。

## 專案結構

```
/
├── app/
│   ├── api/
│   │   ├── webhook/          # LINE Webhook endpoint
│   │   ├── conversations/    # 對話紀錄 API
│   │   └── stats/            # 統計資料 API
│   ├── admin/                # 管理後台頁面
│   └── layout.tsx
├── lib/
│   ├── line/                 # LINE Bot 相關
│   ├── gemini/               # Gemini API 整合
│   ├── game/                 # 遊戲邏輯
│   ├── db/                   # 資料庫模型與連線
│   └── utils/                # 工具函數
└── types/                    # TypeScript 類型定義
```

## API 端點

### Webhook

- `POST /api/webhook` - LINE Webhook endpoint

### 管理後台 API

- `GET /api/conversations` - 取得對話紀錄
  - Query parameters: `userId`, `page`, `limit`
- `GET /api/stats` - 取得統計資料

### 管理後台頁面

- `/admin` - 管理後台介面

## 遊戲功能

### 主要行動

1. **探索 (Explore)**: 觸發隨機事件
2. **查看狀態 (Status)**: 顯示 HP、金幣、道具
3. **前往城鎮 (Town)**: 買賣、治療、接受任務

### 遊戲機制

- 玩家有生命值 (HP)、金幣 (Gold)、道具 (Items) 和劇情標記 (Story Flags)
- 每次探索會觸發由 AI 生成的隨機事件
- 玩家需要擊敗最終 Boss 才能破關
- 遊戲狀態會持久化儲存

## 開發注意事項

- 確保 MongoDB 連線正常
- Gemini API 有 rate limit，已實作基本限制
- LINE Webhook 需要在 30 秒內回應
- 生產環境建議使用 MongoDB Atlas

## License

MIT
