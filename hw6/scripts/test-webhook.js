// Webhook 診斷腳本
const fs = require('fs');
const path = require('path');

console.log('🔍 LINE Webhook 診斷工具\n');

// 檢查環境變數
console.log('1. 檢查環境變數...');
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

const requiredVars = {
  'LINE_CHANNEL_ACCESS_TOKEN': process.env.LINE_CHANNEL_ACCESS_TOKEN,
  'LINE_CHANNEL_SECRET': process.env.LINE_CHANNEL_SECRET,
  'GEMINI_API_KEY': process.env.GEMINI_API_KEY,
  'MONGODB_URI': process.env.MONGODB_URI,
};

let envOk = true;
for (const [key, value] of Object.entries(requiredVars)) {
  if (!value || value.includes('your_') || value.includes('your-')) {
    console.log(`   ❌ ${key}: 未設定`);
    envOk = false;
  } else {
    const displayValue = key.includes('SECRET') || key.includes('TOKEN') || key.includes('KEY')
      ? `${value.substring(0, 10)}...` 
      : value;
    console.log(`   ✅ ${key}: ${displayValue}`);
  }
}

if (!envOk) {
  console.log('\n❌ 請先設定所有環境變數！');
  process.exit(1);
}

console.log('\n2. 檢查 MongoDB 連線...');
const mongoose = require('mongoose');
const mongoUri = process.env.MONGODB_URI;

mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('   ✅ MongoDB 連線成功');
    mongoose.connection.close();
    
    console.log('\n3. 檢查 LINE SDK...');
    try {
      const { Client } = require('@line/bot-sdk');
      const config = {
        channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
        channelSecret: process.env.LINE_CHANNEL_SECRET,
      };
      const client = new Client(config);
      console.log('   ✅ LINE SDK 初始化成功');
      
      console.log('\n✅ 所有檢查通過！');
      console.log('\n💡 下一步：');
      console.log('   1. 執行 npm run dev 啟動開發伺服器');
      console.log('   2. 在另一個終端執行 ngrok http 3000');
      console.log('   3. 將 ngrok URL 設定到 LINE Webhook URL');
      console.log('   4. 測試 Bot\n');
    } catch (error) {
      console.log(`   ❌ LINE SDK 初始化失敗: ${error.message}`);
      process.exit(1);
    }
  })
  .catch((error) => {
    console.log(`   ❌ MongoDB 連線失敗: ${error.message}`);
    console.log('   💡 請確認 MongoDB 正在運行或檢查 MONGODB_URI');
    process.exit(1);
  });

