import { GoogleGenerativeAI } from '@google/generative-ai';
import { checkGeminiRateLimit } from '@/lib/utils/rateLimit';
import { RateLimitError } from '@/lib/utils/errors';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error('Please define the GEMINI_API_KEY environment variable inside .env.local');
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * 清理 JSON 文本，修復常見的格式問題
 * - 移除數字前的 + 號（如 +15 -> 15）
 */
function cleanJsonText(jsonText: string): string {
  // 移除數字前的 + 號（正數前綴）
  return jsonText.replace(/:\s*\+(\d+\.?\d*)/g, ': $1')
                 .replace(/,\s*\+(\d+\.?\d*)/g, ', $1')
                 .replace(/\[\s*\+(\d+\.?\d*)/g, '[$1');
}

const TEXT_PARSER_PROMPT = `你是一個 RPG 遊戲的文本解析器。根據玩家的輸入文字，判斷玩家想要執行的動作。

可用的動作類型：
- reset: 重置遊戲、重新開始、重來、重新來過、從頭開始、重置、restart、reset
- explore: 探索、冒險、前進、繼續、走、移動、搜尋、尋找
- status: 狀態、查看狀態、我的狀態、屬性、能力值、HP、血量
- inventory: 背包、道具、物品、查看道具、我的道具、裝備
- town: 城鎮、商店、買、賣、治療、任務、NPC、回城

請根據玩家的輸入，判斷最可能的動作。如果無法確定，優先選擇 explore。

請以 JSON 格式回應：
{
  "action": "reset" | "explore" | "status" | "inventory" | "town",
  "confidence": 0.0-1.0 (信心度)
}`;

export async function parseUserInput(userText: string): Promise<{
  action: 'reset' | 'explore' | 'status' | 'inventory' | 'town';
  confidence: number;
}> {
  // Check rate limit
  if (!checkGeminiRateLimit()) {
    // Fallback to simple keyword matching if rate limited
    return parseUserInputFallback(userText);
  }

  try {
    const prompt = `${TEXT_PARSER_PROMPT}

玩家輸入：「${userText}」

請解析這個輸入並返回 JSON。`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    let jsonText = text.trim();
    if (jsonText.includes('```json')) {
      jsonText = jsonText.split('```json')[1].split('```')[0].trim();
    } else if (jsonText.includes('```')) {
      jsonText = jsonText.split('```')[1].split('```')[0].trim();
    }

    // Clean JSON text to fix common formatting issues
    jsonText = cleanJsonText(jsonText);

    const parsed = JSON.parse(jsonText);
    
    // Validate response
    if (parsed.action && ['reset', 'explore', 'status', 'inventory', 'town'].includes(parsed.action)) {
      return {
        action: parsed.action,
        confidence: parsed.confidence || 0.5,
      };
    }
    
    return parseUserInputFallback(userText);
  } catch (error) {
    console.error('Error parsing user input:', error);
    return parseUserInputFallback(userText);
  }
}

function parseUserInputFallback(userText: string): {
  action: 'reset' | 'explore' | 'status' | 'inventory' | 'town';
  confidence: number;
} {
  const text = userText.toLowerCase();
  
  // Reset keywords (check first, highest priority)
  if (text.includes('重置') || text.includes('重製') || text.includes('重新開始') || 
      text.includes('重來') || text.includes('重新來過') || text.includes('從頭開始') ||
      text.includes('restart') || text === 'reset' || text.includes('重新') && 
      (text.includes('開始') || text.includes('來過') || text.includes('遊戲'))) {
    return { action: 'reset', confidence: 0.95 };
  }
  
  // Status keywords
  if (text.includes('狀態') || text.includes('status') || text.includes('屬性') || 
      text.includes('能力') || text.includes('hp') || text.includes('血量')) {
    return { action: 'status', confidence: 0.9 };
  }
  
  // Inventory keywords
  if (text.includes('背包') || text.includes('inventory') || text.includes('道具') || 
      text.includes('物品') || text.includes('裝備')) {
    return { action: 'inventory', confidence: 0.9 };
  }
  
  // Town keywords
  if (text.includes('城鎮') || text.includes('town') || text.includes('商店') || 
      text.includes('買') || text.includes('賣') || text.includes('治療') || 
      text.includes('任務') || text.includes('npc')) {
    return { action: 'town', confidence: 0.9 };
  }
  
  // Explore keywords (default)
  if (text.includes('探索') || text.includes('explore') || text.includes('冒險') || 
      text.includes('前進') || text.includes('繼續') || text.includes('走') || 
      text.includes('移動') || text.includes('搜尋') || text.includes('尋找')) {
    return { action: 'explore', confidence: 0.9 };
  }
  
  // Default to explore
  return { action: 'explore', confidence: 0.5 };
}

