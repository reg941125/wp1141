// 環境變數檢查腳本
const fs = require('fs');
const path = require('path');

console.log('🔍 檢查環境變數設定...\n');

const envPath = path.join(process.cwd(), '.env.local');

if (!fs.existsSync(envPath)) {
  console.error('❌ 未找到 .env.local 檔案');
  console.log('\n📝 請執行以下步驟：');
  console.log('   1. 複製 env.example 為 .env.local');
  console.log('   2. 填入你的 LINE 和 Gemini API 憑證\n');
  process.exit(1);
}

require('dotenv').config({ path: envPath });

const requiredVars = [
  'LINE_CHANNEL_ACCESS_TOKEN',
  'LINE_CHANNEL_SECRET',
  'GEMINI_API_KEY',
  'MONGODB_URI',
];

let allSet = true;

console.log('環境變數檢查結果：\n');

requiredVars.forEach((varName) => {
  const value = process.env[varName];
  if (!value || value.includes('your_') || value.includes('your-')) {
    console.log(`❌ ${varName}: 未設定或使用預設值`);
    allSet = false;
  } else {
    const displayValue = varName.includes('SECRET') || varName.includes('TOKEN') || varName.includes('KEY')
      ? `${value.substring(0, 10)}...` 
      : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  }
});

console.log('');

if (!allSet) {
  console.error('❌ 請設定所有必要的環境變數');
  process.exit(1);
}

console.log('✅ 所有環境變數已設定完成！\n');
console.log('💡 下一步：');
console.log('   1. 確保 MongoDB 正在運行');
console.log('   2. 執行 npm run dev 啟動開發伺服器');
console.log('   3. 在另一個終端執行 ngrok http 3000\n');

