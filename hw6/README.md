## Linea Task Pilot

**Linea Task Pilot** 是一個以 Next.js App Router + TypeScript 打造的 LINE 智慧代辦助理專案，串連 Google Gemini LLM 與 MongoDB Atlas，並包含 LINE webhook 後端與即時監控後台。整體架構遵循 `plan.md` 中的五個階段，每一階段都可單獨部署驗證。

## 專案結構

```
src/
├─ app/                # Next.js App Router 入口、靜態頁面與 API route handlers
├─ lib/
│  ├─ env.ts           # Zod 驗證的環境變數讀取
│  └─ logger.ts        # 簡易結構化 logger（後續整合 webhook/debug 用）
└─ public/             # 靜態資源
```

## 環境變數

1. 複製 `env.example` 為 `.env.local`
2. 依照下表填入值

| 變數 | 說明 |
| --- | --- |
| `LINE_CHANNEL_SECRET` | LINE Messaging API Channel secret |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Messaging API channel access token |
| `LINE_WEBHOOK_BASE_URL` | Vercel/自架 webhook base URL（例：`https://xxx.vercel.app`） |
| `GEMINI_API_KEY` | Google AI Studio / Vertex Gemini API 金鑰 |
| `MONGODB_URI` | MongoDB Atlas 連線字串 |
| `MONGODB_DB_NAME` | 預設資料庫名稱 |
| `ADMIN_BASIC_AUTH_USER` & `ADMIN_BASIC_AUTH_PASS` | 後台 Basic Auth |
| `NEXT_PUBLIC_APP_NAME` | 前台顯示名稱，可自訂 |

所有變數在伺服端由 `src/lib/env.ts` 透過 Zod 嚴格驗證，缺值時會於啟動階段即拋錯。

## 開發流程

```bash
npm install          # 安裝依賴
npm run dev          # 啟動 Next.js 開發伺服器 (http://localhost:3000)
npm run lint         # ESLint 檢查
npm run build        # Vercel 專用產出
```

## 架構藍圖

- **LINE webhook**：`/api/line/webhook` route handler，後續整合簽章驗證、事件路由與 Gemini 回覆。
- **LLM 模組**：`src/lib/llm/*`（Phase 2）將封裝 prompt template、降級策略、速率限制偵測。
- **資料庫層**：`src/lib/db/*`（Phase 1/3）以 MongoDB Atlas 持久化 users/todos/messages/sessions。
- **管理後台**：`src/app/admin/*`（Phase 4）提供對話檢視、篩選、統計與操作工具。

## 部署

1. 於 Vercel 建立專案並設定上述環境變數。
2. 將 `/api/line/webhook` URL 填入 LINE Developers Console，啟用 webhook。
3. 參考 `docs/deployment.md` 取得完整部署與驗證 checklist（包含 Basic Auth、MongoDB、Gemini 與營運工具設定）。
4. 發佈後依 `docs/line-playbook.md` 案例逐項驗證 LINE 端體驗。
5. 每個階段結束皆可部署驗證，確保 LINE → Vercel → Gemini/Mongo 串接正常。
