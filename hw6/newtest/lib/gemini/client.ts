import { GoogleGenerativeAI } from '@google/generative-ai';
import type { GameState, GameEvent } from '@/lib/game/types';
import { checkGeminiRateLimit } from '@/lib/utils/rateLimit';
import { LLMError, RateLimitError, getFallbackMessage } from '@/lib/utils/errors';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error('Please define the GEMINI_API_KEY environment variable inside .env.local');
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const SYSTEM_PROMPT = `你是一個極具創意的 RPG 遊戲事件生成器。玩家扮演一位冒險者，在世界中探索。

遊戲規則：
1. 玩家有生命值 (HP)、金幣 (Gold)、道具 (Items) 和劇情標記 (Story Flags)
2. 每次探索會觸發**完全隨機、充滿創意**的事件，必須極度多樣化
3. 事件描述應該生動有趣、引人入勝，長度在 80-150 字之間
4. 每個事件必須提供 2-3 個明確的選項，選項要有不同的風險和回報
5. 每個選項都會影響玩家的狀態（HP、金幣、道具、劇情標記）
6. 玩家需要擊敗最終 Boss 才能破關

**極度隨機性和創意要求：**
- **不要限制於特定事件類型**，你可以創造任何類型的事件
- 事件可以是：戰鬥、寶箱、遭遇、神秘現象、陷阱、NPC互動、環境互動、天氣事件、時間事件、情感事件、解謎、選擇題、道德抉擇、意外發現、隱藏區域、特殊機制等
- 每次生成的事件必須**完全不同**，避免任何重複或模板化
- 事件描述要有**極強的創意**，不要使用常見的 RPG 模板
- 選項要有不同的風險等級（安全但收益低、危險但收益高、平衡、完全隨機等）
- **大膽創新**：可以加入意想不到的情節轉折、幽默元素、哲學思考、道德困境等
- 偶爾加入**極端事件**（極好的運氣、極壞的運氣、完全意外的結果）

**事件類型範例（但不限於此）：**
- combat: 各種戰鬥（野狼、哥布林、骷髏、魔法生物、機械守衛、元素精靈、變形怪、幻影、詛咒生物等）
- treasure: 各種寶物（寶箱、隱藏寶藏、魔法物品、古老遺物、被詛咒的寶物、會說話的寶箱等）
- encounter: 各種遭遇（神秘 NPC、迷路的商人、受傷的旅人、奇怪的生物、時間旅行者、平行世界的自己等）
- mystery: 各種神秘（魔法傳送門、古老遺跡、奇怪的現象、預言、時空裂縫、記憶碎片等）
- trap: 各種陷阱（地洞、毒氣、魔法陷阱、心理陷阱、時間陷阱、幻覺陷阱等）
- npc: 各種互動（任務、交易、對話、謎題、賭博、競賽、合作、背叛等）
- environment: 環境事件（天氣變化、地形改變、自然災害、魔法風暴、時間流逝等）
- social: 社交事件（團隊合作、背叛、談判、說服、欺騙、幫助他人等）
- puzzle: 解謎事件（邏輯謎題、記憶挑戰、模式識別、創意思考等）
- moral: 道德抉擇（拯救 vs 利益、誠實 vs 欺騙、個人 vs 集體等）

**創意提示：**
- 可以結合多種類型（例如：戰鬥中的解謎、寶箱中的 NPC、陷阱中的道德抉擇）
- 可以加入時間元素（過去、現在、未來的選擇）
- 可以加入空間元素（多個維度、平行世界）
- 可以加入情感元素（恐懼、希望、絕望、驚喜）
- 可以加入機制創新（新的遊戲機制、特殊規則、條件觸發）

請用繁體中文回應，並確保回應格式為有效的 JSON。`;

const EVENT_GENERATION_PROMPT = (gameState: GameState, action: string) => {
  const statusInfo = `
當前玩家狀態：
- 等級: ${gameState.level || 1}
- 攻擊力: ${gameState.attack || 10}
- HP: ${gameState.currentHP}/${gameState.maxHP}
- 經驗值: ${gameState.experience || 0}/${getExpRequiredForLevel(gameState.level || 1)}
- 金幣: ${gameState.gold}
- 道具: ${formatItems(gameState.items)}
- 劇情標記: ${JSON.stringify(gameState.storyFlags)}
- 遊戲完成: ${gameState.gameCompleted ? '是' : '否'}
`;

  // 極度隨機的創意提示詞
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
  
  const randomPrompt = creativityPrompts[Math.floor(Math.random() * creativityPrompts.length)];

  return `${SYSTEM_PROMPT}

${statusInfo}

玩家執行的行動：${action}

**創意指令：**
${randomPrompt}

**重要：**
- eventType 可以是任何你認為合適的類型（combat, treasure, encounter, mystery, trap, npc, environment, social, puzzle, moral 等）
- 如果現有類型都不適合，你可以創造新的類型名稱
- 重點是**創意和隨機性**，不要被類型限制

請以以下 JSON 格式回應：

{
  "description": "事件描述（80-150字，必須生動有趣、極具創意、完全獨特）",
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

**創意要求：**
- 每次生成的事件必須完全不同
- 避免使用常見的模板（如「你在森林中遇到...」）
- 加入有趣的細節和描述
- 選項要有創意，不只是「是/否」

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
  action: string
): Promise<GameEvent> {
  // Check rate limit
  if (!checkGeminiRateLimit()) {
    throw new RateLimitError('Gemini API rate limit exceeded');
  }

  try {
    const prompt = action === 'town' 
      ? TOWN_ACTION_PROMPT(gameState)
      : EVENT_GENERATION_PROMPT(gameState, action);

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
    
    // Return fallback event for other errors
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

請生成玩家選擇這個選項後的結果描述（50-100字），描述發生了什麼事。

如果選擇導致發現新事物（如寶箱、怪物、NPC等），請在描述中明確提到，並在回應中標記 "FOLLOW_UP_EVENT"。

請以 JSON 格式回應：
{
  "resultDescription": "選擇結果的描述（50-100字）",
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

function getFallbackEvent(action: string): GameEvent {
  // 隨機選擇一個 fallback 事件類型，增加多樣性
  const eventTypes: Array<'combat' | 'treasure' | 'encounter' | 'mystery' | 'trap'> = 
    ['combat', 'treasure', 'encounter', 'mystery', 'trap'];
  const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

  const fallbackEvents: Record<string, GameEvent> = {
    explore: {
      description: randomType === 'combat' 
        ? '一隻兇猛的野狼從樹叢中跳出來，露出尖銳的獠牙！牠看起來很餓，準備攻擊你。'
        : randomType === 'treasure'
        ? '你發現了一個古老的寶箱，上面佈滿了灰塵和神秘的符文。箱子看起來很重，但你不知道裡面有什麼。'
        : randomType === 'mystery'
        ? '你注意到空氣中瀰漫著奇怪的魔法波動，前方出現了一個閃爍的傳送門。門的另一邊似乎通往未知的地方。'
        : '你在探索時遇到了一個奇怪的現象。周圍的環境突然變得安靜，彷彿時間都停止了。',
      eventType: randomType,
      options: randomType === 'combat' 
        ? [
            {
              text: '勇敢地戰鬥（可能受傷但可能獲得戰利品）',
              action: 'fight',
              effects: {
                hp: -15,
                gold: 25,
                items: { add: ['狼牙'] },
                storyFlags: { monstersDefeated: 1 },
              },
            },
            {
              text: '嘗試逃跑（可能受傷但不會獲得獎勵）',
              action: 'flee',
              effects: {
                hp: -5,
                gold: 0,
              },
            },
            {
              text: '使用道具（如果有藥草可以減少傷害）',
              action: 'use_item',
              effects: {
                hp: -8,
                gold: 20,
                items: { remove: ['藥草'] },
              },
            },
          ]
        : randomType === 'treasure'
        ? [
            {
              text: '謹慎地開啟寶箱（可能觸發陷阱）',
              action: 'open_careful',
              effects: {
                hp: -5,
                gold: 30,
                items: { add: ['古老硬幣'] },
              },
            },
            {
              text: '直接開啟（快速但危險）',
              action: 'open_quick',
              effects: {
                hp: -10,
                gold: 50,
                items: { add: ['神秘寶石'] },
              },
            },
            {
              text: '放棄開啟（安全但沒有收穫）',
              action: 'leave',
              effects: {
                hp: 0,
                gold: 0,
              },
            },
          ]
        : [
            {
              text: '調查這個現象',
              action: 'investigate',
              effects: {
                hp: -5,
                gold: 15,
                items: { add: ['魔法碎片'] },
                storyFlags: { mysteriesSolved: 1 },
              },
            },
            {
              text: '小心地繞過',
              action: 'avoid',
              effects: {
                hp: 0,
                gold: 0,
              },
            },
          ],
    },
    town: {
      description: '你來到了繁華的城鎮，這裡有商店、治療所和任務公會。',
      eventType: 'npc',
      options: [
        {
          text: '前往商店（花費 20 金幣購買藥草）',
          action: 'shop',
          effects: {
            gold: -20,
            items: { add: ['藥草'] },
          },
        },
        {
          text: '前往治療所恢復 HP（花費 30 金幣）',
          action: 'heal',
          effects: {
            gold: -30,
            hp: 50,
          },
        },
        {
          text: '前往任務公會接受任務',
          action: 'quest',
          effects: {
            gold: 10,
            storyFlags: { questsCompleted: 1 },
          },
        },
      ],
    },
  };

  return fallbackEvents[action] || fallbackEvents.explore;
}

