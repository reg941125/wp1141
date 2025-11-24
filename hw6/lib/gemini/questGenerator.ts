import { GoogleGenerativeAI } from '@google/generative-ai';
import type { GameState } from '@/lib/game/types';
import { checkGeminiRateLimit } from '@/lib/utils/rateLimit';
import { RateLimitError } from '@/lib/utils/errors';
import { formatItems } from '@/lib/game/utils';
import { getExpRequiredForLevel } from '@/lib/game/types';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error('Please define the GEMINI_API_KEY environment variable inside .env.local');
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const QUEST_GENERATION_PROMPT = (gameState: GameState) => {
  return `你是一個 RPG 遊戲的任務生成器。請為玩家生成一個有趣且多樣化的任務。

玩家當前狀態：
- 等級: ${gameState.level || 1}
- 攻擊力: ${gameState.attack || 10}
- HP: ${gameState.currentHP}/${gameState.maxHP}
- 經驗值: ${gameState.experience || 0}/${getExpRequiredForLevel(gameState.level || 1)}
- 金幣: ${gameState.gold}
- 道具: ${formatItems(gameState.items)}

請生成一個任務，任務應該：
- 描述簡潔有力（40-80字）
- 任務類型多樣化（可以是：擊敗怪物、尋找物品、護送 NPC、解謎、探索遺跡、收集材料等）
- 任務獎勵要合理（經驗值：30-60，金幣：20-50，可能獲得道具）
- 任務難度要符合玩家等級

請以 JSON 格式回應：
{
  "description": "任務描述（40-80字，簡潔有力）",
  "taskType": "任務類型（如：擊敗怪物、尋找物品、護送、解謎等）",
  "rewards": {
    "experience": 30-60,
    "gold": 20-50,
    "items": ["道具名稱"]（可選）
  },
  "difficulty": "簡單" | "中等" | "困難"
}`;
};

export interface Quest {
  description: string;
  taskType: string;
  rewards: {
    experience: number;
    gold: number;
    items?: string[];
  };
  difficulty: string;
}

export async function generateQuest(gameState: GameState): Promise<Quest> {
  // Check rate limit
  if (!checkGeminiRateLimit()) {
    throw new RateLimitError('Gemini API rate limit exceeded');
  }

  try {
    const prompt = QUEST_GENERATION_PROMPT(gameState);
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

    const quest = JSON.parse(jsonText) as Quest;
    
    // Validate quest structure
    if (!quest.description || !quest.rewards || !quest.taskType) {
      throw new Error('Invalid quest structure');
    }

    return quest;
  } catch (error: any) {
    console.error('Error generating quest:', error);
    
    // Return fallback quest
    return {
      description: '任務公會提供了一個簡單的任務：擊敗附近的怪物。',
      taskType: '擊敗怪物',
      rewards: {
        experience: 40,
        gold: 30,
        items: ['藥草'],
      },
      difficulty: '簡單',
    };
  }
}

