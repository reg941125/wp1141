import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-4">LINE RPG Bot System</h1>
        <p className="text-gray-600 mb-6">
          一個整合 Gemini API 的 LINE Bot RPG 遊戲系統
        </p>
        <div className="space-y-4">
          <Link
            href="/admin"
            className="block w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-center font-medium"
          >
            前往管理後台
          </Link>
          <div className="text-sm text-gray-500">
            <p className="mb-2">功能特色：</p>
            <ul className="list-disc list-inside space-y-1">
              <li>RPG 遊戲系統：探索、戰鬥、收集寶物</li>
              <li>AI 事件生成：使用 Gemini API 動態生成遊戲事件</li>
              <li>LINE Bot 整合：完整的 Messaging API 整合</li>
              <li>管理後台：監控對話、檢視統計</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
