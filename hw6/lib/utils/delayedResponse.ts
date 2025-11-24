import { getClient } from '@/lib/line/client';

// 延遲函數
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 發送處理中訊息並延遲
export async function sendProcessingMessage(
  replyToken: string,
  processingText: string,
  delayMs: number = 800
): Promise<void> {
  const client = getClient();
  
  // 發送處理中訊息
  await client.replyMessage(replyToken, {
    type: 'text',
    text: processingText,
  });
  
  // 延遲
  await delay(delayMs);
}

// 根據動作類型和上下文獲取處理中訊息
export function getProcessingMessage(
  action: string,
  context?: {
    eventType?: string;
    optionText?: string;
  }
): string {
  // 如果有上下文信息，根據事件類型和選項文字來決定訊息
  if (context?.eventType && context?.optionText) {
    const optionText = context.optionText.toLowerCase();
    const eventType = context.eventType.toLowerCase();
    
    // 根據選項文字判斷動作類型
    if (optionText.includes('開啟') || optionText.includes('打開') || optionText.includes('寶箱')) {
      return '📦 正在開啟寶箱...';
    }
    if (optionText.includes('戰鬥') || optionText.includes('攻擊') || optionText.includes('戰鬥')) {
      return '⚔️ 戰鬥中...';
    }
    if (optionText.includes('逃跑') || optionText.includes('逃離') || optionText.includes('離開')) {
      return '🏃 正在逃跑...';
    }
    if (optionText.includes('調查') || optionText.includes('查看') || optionText.includes('觀察')) {
      return '🔍 正在調查中...';
    }
    if (optionText.includes('治療') || optionText.includes('恢復') || optionText.includes('治癒')) {
      return '💚 正在治療中...';
    }
    if (optionText.includes('購買') || optionText.includes('買')) {
      return '🛒 正在購買...';
    }
    if (optionText.includes('接受') || optionText.includes('任務')) {
      return '📜 正在接受任務...';
    }
    if (optionText.includes('幫助') || optionText.includes('救助')) {
      return '🤝 正在幫助...';
    }
    if (optionText.includes('搶劫') || optionText.includes('偷取')) {
      return '👤 正在行動中...';
    }
    
    // 根據事件類型判斷
    if (eventType === 'combat' || eventType === 'boss') {
      return '⚔️ 戰鬥中...';
    }
    if (eventType === 'treasure') {
      return '📦 正在處理寶箱...';
    }
    if (eventType === 'mystery') {
      return '🔮 正在探索神秘現象...';
    }
    if (eventType === 'trap') {
      return '⚠️ 正在應對陷阱...';
    }
    if (eventType === 'npc') {
      return '💬 正在與 NPC 互動...';
    }
  }
  
  // 根據基本動作類型
  const messages: Record<string, string[]> = {
    explore: [
      '🔍 正在探索中...',
      '🔍 搜尋周圍環境...',
      '🔍 仔細觀察四周...',
      '🔍 探索未知區域...',
    ],
    status: [
      '📊 正在查詢狀態...',
      '📊 檢查冒險者資訊...',
    ],
    inventory: [
      '🎒 正在查看背包...',
      '🎒 整理道具中...',
    ],
    town: [
      '🏘️ 正在前往城鎮...',
      '🏘️ 走在城鎮街道上...',
    ],
    choice: [
      '💫 處理選擇中...',
      '✨ 執行行動中...',
    ],
    use_item: [
      '✨ 正在使用道具...',
      '✨ 道具生效中...',
    ],
    inspect_item: [
      '🔍 正在查看道具...',
      '🔍 請稍候...',
    ],
    default: [
      '⏳ 處理中...',
    ],
  };
  
  const actionMessages = messages[action] || messages.default;
  // 隨機選擇一個訊息，增加變化
  return actionMessages[Math.floor(Math.random() * actionMessages.length)];
}

