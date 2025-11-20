// LINE 配置檢查腳本
require('dotenv').config({ path: '.env.local' });

console.log('🔍 檢查 LINE Bot 配置...\n');

const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const channelSecret = process.env.LINE_CHANNEL_SECRET;

console.log('1. LINE_CHANNEL_ACCESS_TOKEN:');
if (!channelAccessToken) {
  console.log('   ❌ 未設定');
} else if (channelAccessToken.includes('your_') || channelAccessToken.includes('your-')) {
  console.log('   ❌ 使用預設值（請填入實際的 Token）');
} else {
  console.log(`   ✅ 已設定 (長度: ${channelAccessToken.length})`);
  console.log(`   📋 前 10 個字元: ${channelAccessToken.substring(0, 10)}...`);
}

console.log('\n2. LINE_CHANNEL_SECRET:');
if (!channelSecret) {
  console.log('   ❌ 未設定');
} else if (channelSecret.includes('your_') || channelSecret.includes('your-')) {
  console.log('   ❌ 使用預設值（請填入實際的 Secret）');
} else {
  console.log(`   ✅ 已設定 (長度: ${channelSecret.length})`);
  console.log(`   📋 前 10 個字元: ${channelSecret.substring(0, 10)}...`);
}

console.log('\n3. 驗證建議:');
console.log('   - 確認 Channel Access Token 和 Channel Secret 來自同一個 LINE Channel');
console.log('   - 確認沒有多餘的空格或換行符號');
console.log('   - 如果使用 ngrok，確認 Webhook URL 設定正確');
console.log('   - 在 LINE Developers Console 中點擊 "Verify" 按鈕測試 Webhook\n');

if (!channelAccessToken || !channelSecret || 
    channelAccessToken.includes('your_') || channelSecret.includes('your_')) {
  console.log('❌ 請先設定正確的 LINE 憑證！');
  process.exit(1);
} else {
  console.log('✅ LINE 配置看起來正確！');
}

