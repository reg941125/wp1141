import { GoogleGenerativeAI } from '@google/generative-ai';
import type { GameState, GameEvent } from '@/lib/game/types';
import { getExpRequiredForLevel } from '@/lib/game/types';
import { checkGeminiRateLimit } from '@/lib/utils/rateLimit';
import { LLMError, RateLimitError } from '@/lib/utils/errors';
import { formatItems } from '@/lib/game/utils';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error('Please define the GEMINI_API_KEY environment variable inside .env.local');
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

/**
 * 清理 JSON 文本，修復常見的格式問題
 * - 移除數字前的 + 號（如 +15 -> 15）
 * - 移除多餘的空白字符
 */
function cleanJsonText(jsonText: string): string {
  // 移除數字前的 + 號（正數前綴）
  // 匹配模式：": +數字 或 ": +數字.數字
  let cleaned = jsonText.replace(/:\s*\+(\d+\.?\d*)/g, ': $1');
  
  // 移除其他可能的 + 號前綴（在數組或對象中）
  cleaned = cleaned.replace(/,\s*\+(\d+\.?\d*)/g, ', $1');
  cleaned = cleaned.replace(/\[\s*\+(\d+\.?\d*)/g, '[$1');
  
  return cleaned;
}

const SYSTEM_PROMPT = `你是一個極具創意的 RPG 遊戲事件生成器。玩家扮演一位冒險者，在世界中探索。

遊戲規則：
1. 玩家有等級、生命值 (HP)、金幣、經驗值、道具和劇情標記
2. 每次探索會觸發**完全隨機、充滿創意**的事件，必須極度多樣化
3. 事件描述應該生動有趣、引人入勝，長度在 40-80 字之間（簡潔有力，不要冗長）
4. 每個事件必須提供 2-3 個明確的選項，選項要有不同的風險和回報
5. 每個選項都會影響玩家的狀態（HP、經驗值、金幣、道具、劇情標記）
6. **重要：每個選項都應該給予經驗值獎勵**（戰鬥勝利：20-50，完成任務：30-60，探索發現：10-30，解決謎題：15-40等）
7. 玩家需要擊敗最終 Boss 才能破關
8. 希望你可以思考快一點

**極度隨機性和創意要求：**
- **不要限制於特定事件類型**，你可以創造任何類型的事件
- 事件可以是：戰鬥、寶箱、遭遇、神秘現象、陷阱、NPC互動、環境互動、天氣事件、時間事件、情感事件、解謎、選擇題、道德抉擇、意外發現、隱藏區域、特殊機制等
- 每次生成的事件必須**完全不同**，避免任何重複或模板化
- 事件描述要有**極強的創意**，不要使用常見的 RPG 模板
- 選項要有不同的風險等級（安全但收益低、危險但收益高、平衡、完全隨機等）
- **大膽創新**：可以加入意想不到的情節轉折、幽默元素、哲學思考、道德困境等
- 偶爾加入**極端事件**（極好的運氣、極壞的運氣、完全意外的結果）

**事件類型範例（僅供參考，請創造全新內容）：**
⚠️ **重要：以下只是範例！**

範例類型（僅供理解概念）：
- combat: 戰鬥類型（範例：野狼、哥布林、骷髏等）
- treasure: 寶物類型（範例：寶箱、隱藏寶藏等，但請創造全新的發現方式）
- encounter: 遭遇類型（範例：NPC、商人、旅人等，但請創造全新的角色）
- mystery: 神秘類型（範例：傳送門、遺跡、現象等，但請創造全新的神秘事件）
- trap: 陷阱類型（範例：地洞、毒氣、魔法陷阱等，但請創造全新的陷阱機制）
- npc: 互動類型（範例：任務、交易、對話等，但請創造全新的互動方式）
- environment: 環境類型（範例：天氣、地形、災害等，但請創造全新的環境變化）
- social: 社交類型（範例：合作、背叛、談判等，但請創造全新的社交情境）
- puzzle: 解謎類型（範例：邏輯謎題、記憶挑戰等，但請創造全新的謎題）
- moral: 道德類型（範例：拯救 vs 利益等，但請創造全新的道德困境）

**嚴格要求：**
- ❌ 絕對不要使用「野狼從樹叢跳出來」這種常見描述
- ❌ 絕對不要使用「發現古老寶箱」這種模板化描述
- ❌ 絕對不要使用「魔法傳送門」這種常見元素
- ❌ 絕對不要重複任何之前生成過的內容
- ✅ 每次都要創造**完全獨特、前所未見**的事件
- ✅ 發揮創意，結合意想不到的元素
- ✅ 讓每個事件都讓玩家感到驚喜和新鮮

**創意提示：**
- 可以結合多種類型（例如：戰鬥中的解謎、寶箱中的 NPC、陷阱中的道德抉擇）
- 可以加入時間元素（過去、現在、未來的選擇）
- 可以加入空間元素（多個維度、平行世界）
- 可以加入情感元素（恐懼、希望、絕望、驚喜）
- 可以加入機制創新（新的遊戲機制、特殊規則、條件觸發）

請用繁體中文回應，並確保回應格式為有效的 JSON。`;

const EVENT_GENERATION_PROMPT = (gameState: GameState, action: string, userInput?: string) => {
  const statusInfo = `
當前玩家狀態：
- 等級: ${gameState.level || 1}
- HP: ${gameState.currentHP}/${gameState.maxHP}
- 經驗值: ${gameState.experience || 0}/${getExpRequiredForLevel(gameState.level || 1)}
- 金幣: ${gameState.gold}
- 道具: ${formatItems(gameState.items)}
- 劇情標記: ${JSON.stringify(gameState.storyFlags)}
- 遊戲完成: ${gameState.gameCompleted ? '是' : '否'}
`;

  // 根據用戶輸入決定事件類型
  let eventTypeGuidance = '';
  if (userInput && userInput.trim()) {
    const input = userInput.toLowerCase();
    
    // 戰鬥相關關鍵字
    if (input.includes('打') || input.includes('戰鬥') || input.includes('戰鬥') || 
        input.includes('攻擊') || input.includes('怪物') || input.includes('敵人') ||
        input.includes('怪') || input.includes('fight') || input.includes('combat')) {
      eventTypeGuidance = `\n**重要：玩家明確表示想要戰鬥（輸入：「${userInput}」），請生成一個**戰鬥類型 (combat)**的事件，包含怪物、敵人或其他戰鬥對手。`;
    }
    // 寶箱/寶物相關關鍵字
    else if (input.includes('寶箱') || input.includes('寶物') || input.includes('寶藏') ||
             input.includes('尋找') || input.includes('搜尋') || input.includes('探索') ||
             input.includes('treasure') || input.includes('chest') || input.includes('寶')) {
      eventTypeGuidance = `\n**重要：玩家想要尋找寶物（輸入：「${userInput}」），請生成一個**寶物類型 (treasure)**的事件，包含寶箱、隱藏寶藏或魔法物品。`;
    }
    // NPC/互動相關關鍵字
    else if (input.includes('npc') || input.includes('對話') || input.includes('說話') ||
             input.includes('任務') || input.includes('商人') || input.includes('幫助')) {
      eventTypeGuidance = `\n**重要：玩家想要與 NPC 互動（輸入：「${userInput}」），請生成一個**NPC 互動類型 (npc)**的事件，包含任務、交易或對話。`;
    }
    // 神秘/謎題相關關鍵字
    else if (input.includes('神秘') || input.includes('謎題') || input.includes('解謎') ||
             input.includes('調查') || input.includes('探索') || input.includes('mystery')) {
      eventTypeGuidance = `\n**重要：玩家想要探索神秘事件（輸入：「${userInput}」），請生成一個**神秘類型 (mystery)**的事件，包含魔法現象、遺跡或謎題。`;
    }
    // 如果用戶有輸入但沒有明確類型，讓 LLM 根據輸入判斷
    else {
      eventTypeGuidance = `\n**重要：玩家輸入：「${userInput}」，請根據這個輸入的意圖，生成相應類型的事件。如果輸入暗示戰鬥，生成戰鬥事件；如果暗示尋找寶物，生成寶物事件；如果暗示互動，生成 NPC 事件。`;
    }
  }

  // 極度隨機的創意提示詞（如果沒有用戶輸入引導）
  const creativityPrompts = [
    '這次生成一個**完全創新、前所未有**的事件，不要使用常見的 RPG 模板',
    '這次生成一個**結合多種元素**的事件（例如：戰鬥+解謎、寶箱+道德抉擇）',
    '這次生成一個**極度意外**的事件，讓玩家完全想不到會發生什麼',
    '這次生成一個**充滿創意和幽默**的事件，可以加入有趣的元素',
    '這次生成一個**哲學或道德層面**的事件，讓玩家思考',
    '這次生成一個**時空或維度相關**的事件，打破常規',
    '這次生成一個**情感豐富**的事件，觸動玩家的感受',
    '這次生成一個**機制創新**的事件，引入新的遊戲玩法',
    '這次生成一個**極端情況**的事件（極好或極壞的運氣）',
    '這次生成一個**完全隨機、無法預測**的事件',
  ];
  
  const randomPrompt = userInput && userInput.trim() 
    ? `根據玩家的輸入「${userInput}」生成相應的事件`
    : creativityPrompts[Math.floor(Math.random() * creativityPrompts.length)];

  return `${SYSTEM_PROMPT}

${statusInfo}

玩家執行的行動：${action}
${userInput ? `玩家輸入：「${userInput}」` : ''}

${eventTypeGuidance}

**創意指令：**
${randomPrompt}

**重要：**
- eventType 可以是任何你認為合適的類型（combat, treasure, encounter, mystery, trap, npc, environment, social, puzzle, moral 等）
- 如果現有類型都不適合，你可以創造新的類型名稱
- 重點是**創意和隨機性**，不要被類型限制

請以以下 JSON 格式回應：

{
  "description": "事件描述（40-80字，簡潔有力、生動有趣、極具創意、完全獨特）",
  "eventType": "任何合適的事件類型（可以是 combat, treasure, encounter, mystery, trap, npc, environment, social, puzzle, moral 等，或自創類型）",
  "options": [
    {
      "text": "選項1的文字描述（明確說明行動和風險）",
      "action": "選項1的簡短標識",
      "effects": {
        "hp": 數值（可正可負，戰鬥通常為負，治療為正）,
        "gold": 數值（可正可負，獲得為正，花費為負）,
        "items": {
          "add": ["道具名稱1", "道具名稱2"]（可選，如：藥草、劍、盾牌、魔法卷軸等）,
          "remove": ["道具名稱"]（可選，使用道具時移除）
        },
        "storyFlags": {
          "標記名稱": 值（可選，如：monstersDefeated, treasuresFound, mysteriesSolved）
        }
      }
    },
    {
      "text": "選項2的文字描述",
      "action": "選項2的簡短標識",
      "effects": { ... }
    },
    {
      "text": "選項3的文字描述（可選）",
      "action": "選項3的簡短標識",
      "effects": { ... }
    }
  ]
}

**事件生成要求：**
1. **戰鬥事件**：必須有攻擊、防禦、逃跑等選項，不同選項有不同 HP 損失和獎勵
2. **寶箱事件**：必須有風險，可能遇到陷阱、怪物、或空箱，選項包括謹慎開啟、直接開啟、放棄
3. **隨機遭遇**：NPC、生物、現象等，選項要有互動性
4. **神秘事件**：魔法、遺跡、預言等，選項要有探索性
5. **陷阱事件**：地洞、毒氣、魔法陷阱等，選項要有應對策略

**平衡性建議：**
- 如果玩家 HP < 30：可以生成治療機會或較安全的選項
- 如果玩家 HP > 80：可以生成更具挑戰性的事件
- 如果玩家金幣 < 20：可以生成賺錢機會
- 如果玩家金幣 > 100：可以生成花費機會
- 確保至少有一個選項不會導致死亡（HP 不會歸零）

**創意要求（嚴格遵守）：**
- ⚠️ **絕對禁止重複**：每次生成的事件必須完全不同，不要使用任何之前生成過的內容
- ⚠️ **禁止常見模板**：避免使用「你在森林中遇到...」、「一隻野狼跳出來...」、「發現古老寶箱...」等常見描述
- ⚠️ **禁止固定元素**：不要固定使用野狼、寶箱、傳送門等常見元素，每次都要創造全新的內容
- ✅ **必須創新**：加入意想不到的元素、創新的機制、獨特的描述
- ✅ **必須多樣化**：每次都要創造完全不同的敵人、發現、遭遇、現象
- ✅ **必須有趣**：加入有趣的細節、幽默、轉折、驚喜
- ✅ **選項要有創意**：不只是「是/否」，要有創新的選擇方式

現在請生成一個**完全隨機、充滿創意**的事件！
`;
};

const TOWN_ACTION_PROMPT = (gameState: GameState) => {
  return `${SYSTEM_PROMPT}

玩家當前狀態：
- HP: ${gameState.currentHP}/${gameState.maxHP}
- 金幣: ${gameState.gold}
- 道具: ${formatItems(gameState.items)}

玩家選擇前往城鎮。請生成城鎮中的活動選項，以 JSON 格式回應：

{
  "description": "你來到了繁華的城鎮，這裡有商店、治療所和任務公會。",
  "options": [
    {
      "text": "前往商店購買道具",
      "action": "shop",
      "effects": {
        "gold": -20,
        "items": {
          "add": ["藥草", "劍"]
        }
      }
    },
    {
      "text": "前往治療所恢復 HP（花費 30 金幣）",
      "action": "heal",
      "effects": {
        "gold": -30,
        "hp": 50
      }
    },
    {
      "text": "前往任務公會接受任務",
      "action": "quest",
      "effects": {
        "storyFlags": {
          "questsCompleted": ${(gameState.storyFlags.questsCompleted as number) || 0} + 1
        }
      }
    }
  ]
}
`;
};

export async function generateEvent(
  gameState: GameState,
  action: string,
  userInput?: string
): Promise<GameEvent> {
  // Check rate limit
  if (!checkGeminiRateLimit()) {
    throw new RateLimitError('Gemini API rate limit exceeded');
  }

  try {
    const prompt = action === 'town' 
      ? TOWN_ACTION_PROMPT(gameState)
      : EVENT_GENERATION_PROMPT(gameState, action, userInput);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = text.trim();
    if (jsonText.includes('```json')) {
      jsonText = jsonText.split('```json')[1].split('```')[0].trim();
    } else if (jsonText.includes('```')) {
      jsonText = jsonText.split('```')[1].split('```')[0].trim();
    }

    // Clean JSON text to fix common formatting issues
    jsonText = cleanJsonText(jsonText);

    const event = JSON.parse(jsonText) as GameEvent;

    // Validate event structure
    if (!event.description || !event.options || event.options.length < 2) {
      throw new Error('Invalid event structure');
    }

    return event;
  } catch (error: any) {
    console.error('Error generating event:', error);
    
    // Handle specific errors
    if (error instanceof RateLimitError) {
      throw error;
    }
    
    if (error.status === 429) {
      throw new LLMError('Rate limit exceeded', '429');
    }
    
    if (error.status === 500 || error.status === 503) {
      throw new LLMError('Service unavailable', String(error.status));
    }
    
    // Try to generate fallback event using LLM with simplified prompt
    try {
      const fallbackPrompt = `你是一個 RPG 遊戲事件生成器。請生成一個**完全獨特、充滿創意**的探索事件。

⚠️ **重要：絕對不要使用常見的模板（如野狼、寶箱、傳送門等），請創造全新的內容！**

玩家狀態：
- 等級: ${gameState.level || 1}
- 攻擊力: ${gameState.attack || 10}
- HP: ${gameState.currentHP}/${gameState.maxHP}
- 經驗值: ${gameState.experience || 0}/${getExpRequiredForLevel(gameState.level || 1)}
- 金幣: ${gameState.gold}
- 道具: ${formatItems(gameState.items)}

請生成一個簡短的探索事件（40-60字），必須：
- 完全獨特，不要使用任何常見的 RPG 模板
- 充滿創意，讓玩家感到驚喜
- 包含 2-3 個選項
- 每個選項都應該給予經驗值（10-30）

請以 JSON 格式回應：
{
  "description": "事件描述（40-60字，簡潔有力、必須獨特創新）",
  "eventType": "任何合適的類型",
  "options": [
    {
      "text": "選項1",
      "action": "action1",
      "effects": {
        "hp": 數值,
        "experience": 10-30,
        "gold": 數值,
        "items": { "add": [] }
      }
    }
  ]
}`;

      const fallbackResult = await model.generateContent(fallbackPrompt);
      const fallbackResponse = await fallbackResult.response;
      const fallbackText = fallbackResponse.text();

      let fallbackJsonText = fallbackText.trim();
      if (fallbackJsonText.includes('```json')) {
        fallbackJsonText = fallbackJsonText.split('```json')[1].split('```')[0].trim();
      } else if (fallbackJsonText.includes('```')) {
        fallbackJsonText = fallbackJsonText.split('```')[1].split('```')[0].trim();
      }

      // Clean JSON text to fix common formatting issues
      fallbackJsonText = cleanJsonText(fallbackJsonText);

      const fallbackEvent = JSON.parse(fallbackJsonText) as GameEvent;
      
      if (fallbackEvent.description && fallbackEvent.options && fallbackEvent.options.length >= 2) {
        return fallbackEvent;
      }
    } catch (fallbackError) {
      console.error('Error generating fallback event:', fallbackError);
    }
    
    // Ultimate fallback: return a very simple event structure (only when all LLM calls fail)
    return getFallbackEvent(action);
  }
}

export async function generateChoiceResult(
  gameState: GameState,
  eventDescription: string,
  selectedOptionText: string,
  effects: any
): Promise<{ resultDescription: string; shouldGenerateFollowUp: boolean }> {
  // Check rate limit
  if (!checkGeminiRateLimit()) {
    throw new RateLimitError('Gemini API rate limit exceeded');
  }

  try {
    const prompt = `${SYSTEM_PROMPT}

當前事件：${eventDescription}

玩家選擇：${selectedOptionText}

選擇效果：
${effects.hp ? `- HP: ${effects.hp > 0 ? '+' : ''}${effects.hp}` : ''}
${effects.gold ? `- 金幣: ${effects.gold > 0 ? '+' : ''}${effects.gold}` : ''}
${effects.items?.add ? `- 獲得道具: ${effects.items.add.join(', ')}` : ''}
${effects.items?.remove ? `- 失去道具: ${effects.items.remove.join(', ')}` : ''}

當前狀態：
- HP: ${gameState.currentHP}/${gameState.maxHP}
- 金幣: ${gameState.gold}
- 道具: ${formatItems(gameState.items)}

請生成玩家選擇這個選項後的結果描述（30-60字），簡潔描述發生了什麼事。

如果選擇導致發現新事物（如寶箱、怪物、NPC等），請在描述中明確提到，並在回應中標記 "FOLLOW_UP_EVENT"。

請以 JSON 格式回應：
{
  "resultDescription": "選擇結果的描述（30-60字，簡潔有力）",
  "shouldGenerateFollowUp": true/false（如果發現新事物需要後續事件則為 true）
}

重要：
- 結果描述要生動有趣，符合 RPG 風格
- 如果選擇是「調查」、「探索」、「查看」等，結果應該描述發現了什麼
- 如果發現了寶箱、怪物、NPC 等，shouldGenerateFollowUp 應該為 true
- 不要直接跳到開啟寶箱或戰鬥，而是先描述發現了什麼`;

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

    const choiceResult = JSON.parse(jsonText);
    return {
      resultDescription: choiceResult.resultDescription || '你執行了這個選擇。',
      shouldGenerateFollowUp: choiceResult.shouldGenerateFollowUp || false,
    };
  } catch (error: any) {
    console.error('Error generating choice result:', error);
    return {
      resultDescription: `你選擇了：${selectedOptionText}`,
      shouldGenerateFollowUp: false,
    };
  }
}

export async function generateResponse(
  context: Array<{ role: 'user' | 'assistant'; content: string }>,
  gameState: GameState
): Promise<string> {
  // Check rate limit
  if (!checkGeminiRateLimit()) {
    throw new RateLimitError('Gemini API rate limit exceeded');
  }

  try {
    const contextPrompt = context
      .map((msg) => `${msg.role === 'user' ? '玩家' : '系統'}: ${msg.content}`)
      .join('\n');

    const prompt = `${SYSTEM_PROMPT}

對話歷史：
${contextPrompt}

當前狀態：
- HP: ${gameState.currentHP}/${gameState.maxHP}
- 金幣: ${gameState.gold}
- 道具: ${formatItems(gameState.items)}

請根據對話歷史和當前狀態，生成一個簡短、友善的回應（50字以內）。`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error: any) {
    console.error('Error generating response:', error);
    
    if (error instanceof RateLimitError) {
      throw error;
    }
    
    if (error.status === 429) {
      throw new LLMError('Rate limit exceeded', '429');
    }
    
    return '抱歉，我現在無法回應。請稍後再試。';
  }
}

export async function generateItemIntroduction(itemName: string, itemEffect?: { description: string; hp?: number; gold?: number }): Promise<string> {
  // Check rate limit
  if (!checkGeminiRateLimit()) {
    // If rate limited, return fallback
    return itemEffect?.description || '神秘物品，似乎很重要';
  }

  try {
    const effectInfo = itemEffect 
      ? `道具效果：${itemEffect.description}${itemEffect.hp ? `（恢復 ${itemEffect.hp} HP）` : ''}${itemEffect.gold ? `（獲得 ${itemEffect.gold} 金幣）` : ''}`
      : '這是一個特殊的道具';

    const prompt = `你是一個 RPG 遊戲的道具描述生成器。請為道具「${itemName}」生成一個簡短、生動的介紹。

${effectInfo}

要求：
- 長度必須在 5-20 字之間（嚴格遵守）
- 要生動有趣，符合 RPG 遊戲風格
- 可以描述道具的外觀、質感、氣息、歷史等
- 不要重複道具名稱
- 使用繁體中文

請直接回應介紹文字，不要包含任何其他內容或標點符號（除了必要的標點）。`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let intro = response.text().trim();
    
    // Remove any markdown formatting or extra text
    intro = intro.replace(/```/g, '').replace(/json/g, '').trim();
    
    // Ensure length is between 5-20 characters
    if (intro.length > 20) {
      intro = intro.slice(0, 20);
    }
    if (intro.length < 5) {
      // If too short, pad with descriptive text
      intro = intro + '的神秘物品';
      if (intro.length > 20) {
        intro = intro.slice(0, 20);
      }
    }
    
    return intro;
  } catch (error: any) {
    console.error('Error generating item introduction:', error);
    
    // Return fallback introduction
    return itemEffect?.description || '神秘物品，似乎很重要';
  }
}

function getFallbackEvent(action: string): GameEvent {
  // 最簡單的 fallback，只在所有 LLM 調用都失敗時使用
  // 這是一個最基本的結構，不包含詳細描述，避免影響 LLM 的創意
  const fallbackEvents: Record<string, GameEvent> = {
    explore: {
      description: '你在探索時遇到了一個事件。',
      eventType: 'encounter',
      options: [
        {
          text: '繼續探索',
          action: 'continue',
          effects: {
            hp: 0,
            experience: 15,
            gold: 10,
          },
        },
        {
          text: '小心觀察',
          action: 'observe',
          effects: {
            hp: 0,
            experience: 10,
            gold: 5,
          },
        },
      ],
    },
    town: {
      description: '你來到了城鎮。',
      eventType: 'npc',
      options: [
        {
          text: '前往商店',
          action: 'shop',
          effects: {
            experience: 10,
            gold: -20,
            items: { add: ['藥草'] },
          },
        },
        {
          text: '前往治療所',
          action: 'heal',
          effects: {
            experience: 10,
            gold: -30,
            hp: 50,
          },
        },
        {
          text: '前往任務公會',
          action: 'quest',
          effects: {
            experience: 40,
            gold: 10,
            storyFlags: { questsCompleted: 1 },
          },
        },
      ],
    },
  };

  return fallbackEvents[action] || fallbackEvents.explore;
}

