import Link from "next/link";
import { PUBLIC_APP_NAME } from "@/lib/env";

const roadmap = [
  {
    title: "Phase 1",
    bullets: ["Line webhook", "Mongo schemas", "Env validation"],
  },
  {
    title: "Phase 2",
    bullets: ["Gemini prompt + routing", "LLM fallback", "Todo ops"],
  },
  {
    title: "Phase 3+",
    bullets: ["Persistence & analytics", "Realtime admin", "QA + deploy"],
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-12 px-6 py-16 text-zinc-900">
      <section className="rounded-3xl border border-zinc-200 bg-white p-10 shadow-sm">
        <p className="text-sm uppercase tracking-[0.2rem] text-emerald-600">
          LINE AI To-do Assistant
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight">
          {PUBLIC_APP_NAME}
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-zinc-600">
          智慧代辦事項助理，專責理解自然語言、分類任務、推論期限並在任務過大時主動拆解。此
          Next.js/Vercel 專案會串接 LINE Messaging API、Google Gemini 以及 MongoDB
          Atlas，並提供後台監控與降級機制。
        </p>
        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <span className="rounded-full bg-emerald-100 px-4 py-2 text-emerald-700">
            Next.js App Router
          </span>
          <span className="rounded-full bg-sky-100 px-4 py-2 text-sky-700">
            Gemini LLM
          </span>
          <span className="rounded-full bg-violet-100 px-4 py-2 text-violet-700">
            LINE Messaging API
          </span>
          <span className="rounded-full bg-amber-100 px-4 py-2 text-amber-700">
            MongoDB Atlas
          </span>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">環境變數設定</h2>
          <p className="mt-3 text-sm text-zinc-600">
            請複製 `.env.example` 為 `.env.local` 並填入正式金鑰。
          </p>
          <ul className="mt-4 space-y-2 text-sm text-zinc-700">
            <li>• LINE channel secret / access token / webhook URL</li>
            <li>• Google Gemini API key</li>
            <li>• MongoDB URI 與 DB 名稱</li>
            <li>• 後台 Basic Auth 認證資訊</li>
          </ul>
        </div>
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">接下來的任務</h2>
          <ol className="mt-4 space-y-4 text-sm text-zinc-700">
            {roadmap.map((phase) => (
              <li key={phase.title}>
                <p className="font-semibold text-zinc-900">{phase.title}</p>
                <p className="text-zinc-600">
                  {phase.bullets.join(" · ")}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="rounded-3xl border border-dashed border-emerald-300 bg-emerald-50 p-8 text-emerald-900">
        <h2 className="text-2xl font-semibold">立即連結 LINE</h2>
        <p className="mt-3 text-sm leading-6">
          Webhook 將部署於 Vercel Route Handler：`/api/line/webhook`。
          完成部署後，請至 LINE Developers console
          啟用 webhook 並對照簽章驗證結果，以確保訊息能成功送抵。
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm font-medium">
          <Link
            className="rounded-full bg-emerald-600 px-5 py-2 text-white transition hover:bg-emerald-700"
            href="https://developers.line.biz/en/docs/messaging-api/getting-started/"
            target="_blank"
            rel="noreferrer"
          >
            LINE Messaging API Docs
          </Link>
          <Link
            className="rounded-full bg-white px-5 py-2 text-emerald-700 shadow-sm"
            href="https://ai.google.dev/gemini-api/docs"
            target="_blank"
            rel="noreferrer"
          >
            Gemini API Docs
          </Link>
        </div>
      </section>
    </main>
  );
}
