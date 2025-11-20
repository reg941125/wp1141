# Windows PowerShell 啟動腳本
# 用於快速啟動本地開發環境

Write-Host "🚀 啟動 LINE RPG Bot 本地開發環境..." -ForegroundColor Green

# 檢查 .env.local 是否存在
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  未找到 .env.local 檔案" -ForegroundColor Yellow
    Write-Host "📝 請先複製 env.example 為 .env.local 並填入你的憑證" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "執行: Copy-Item env.example .env.local" -ForegroundColor Cyan
    exit 1
}

# 檢查 node_modules 是否存在
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 安裝依賴..." -ForegroundColor Yellow
    npm install
}

Write-Host "✅ 環境檢查完成" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 啟動開發伺服器..." -ForegroundColor Cyan
Write-Host "📌 伺服器將運行在: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 提示: 在另一個終端執行 'ngrok http 3000' 來暴露伺服器到公網" -ForegroundColor Yellow
Write-Host ""

# 啟動開發伺服器
npm run dev

