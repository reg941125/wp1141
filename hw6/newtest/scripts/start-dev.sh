#!/bin/bash
# macOS/Linux 啟動腳本
# 用於快速啟動本地開發環境

echo "🚀 啟動 LINE RPG Bot 本地開發環境..."

# 檢查 .env.local 是否存在
if [ ! -f ".env.local" ]; then
    echo "⚠️  未找到 .env.local 檔案"
    echo "📝 請先複製 env.example 為 .env.local 並填入你的憑證"
    echo ""
    echo "執行: cp env.example .env.local"
    exit 1
fi

# 檢查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
    echo "📦 安裝依賴..."
    npm install
fi

echo "✅ 環境檢查完成"
echo ""
echo "🌐 啟動開發伺服器..."
echo "📌 伺服器將運行在: http://localhost:3000"
echo ""
echo "💡 提示: 在另一個終端執行 'ngrok http 3000' 來暴露伺服器到公網"
echo ""

# 啟動開發伺服器
npm run dev

