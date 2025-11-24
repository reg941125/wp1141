// 道具效果定義
export interface ItemEffect {
  hp?: number;
  gold?: number;
  description: string;
}

export const ITEM_EFFECTS: Record<string, ItemEffect> = {
  '藥草': {
    hp: 30,
    description: '恢復 30 HP',
  },
  '神秘藥水': {
    hp: 50,
    description: '恢復 50 HP',
  },
  '強效藥水': {
    hp: 80,
    description: '恢復 80 HP',
  },
  '生命藥水': {
    hp: 100,
    description: '完全恢復 HP',
  },
  '金幣袋': {
    gold: 50,
    description: '獲得 50 金幣',
  },
  '大金幣袋': {
    gold: 100,
    description: '獲得 100 金幣',
  },
  '劍': {
    description: '武器，在戰鬥中增加攻擊力',
  },
  '盾牌': {
    description: '防具，在戰鬥中減少傷害',
  },
  '魔法卷軸': {
    description: '神秘的魔法物品',
  },
  '古老硬幣': {
    description: '古老的硬幣，可能有特殊用途',
  },
  '神秘寶石': {
    description: '閃爍著神秘光芒的寶石',
  },
  '魔法碎片': {
    description: '魔法能量的碎片',
  },
  '狼牙': {
    description: '從野狼身上獲得的戰利品',
  },
};

// 緩存已生成的道具介紹，避免重複調用 API
const itemIntroductionCache: Record<string, string> = {};

export function getItemEffect(itemName: string): ItemEffect | null {
  return ITEM_EFFECTS[itemName] || null;
}

export function canUseItem(itemName: string): boolean {
  const effect = getItemEffect(itemName);
  if (!effect) return false;
  // 只有有 HP 或金幣效果的道具才能使用
  return effect.hp !== undefined || effect.gold !== undefined;
}

/**
 * 獲取道具介紹（使用 Gemini 生成，帶緩存）
 * @param itemName 道具名稱
 * @returns 道具介紹（5-20 字）
 */
export async function getItemIntroduction(itemName: string): Promise<string> {
  // 檢查緩存
  if (itemIntroductionCache[itemName]) {
    return itemIntroductionCache[itemName];
  }

  const effect = getItemEffect(itemName);
  
  try {
    // 動態導入以避免循環依賴
    const { generateItemIntroduction } = await import('@/lib/gemini/client');
    const intro = await generateItemIntroduction(itemName, effect || undefined);
    
    // 確保長度在 5-20 字之間
    let finalIntro = intro.trim();
    if (finalIntro.length > 20) {
      finalIntro = finalIntro.slice(0, 20);
    }
    if (finalIntro.length < 5) {
      finalIntro = finalIntro + '的神秘物品';
      if (finalIntro.length > 20) {
        finalIntro = finalIntro.slice(0, 20);
      }
    }
    
    // 存入緩存
    itemIntroductionCache[itemName] = finalIntro;
    return finalIntro;
  } catch (error) {
    console.error(`Error generating introduction for ${itemName}:`, error);
    // 如果生成失敗，使用 fallback
    const fallback = effect?.description || '神秘物品，似乎很重要';
    const trimmed = fallback.trim();
    if (trimmed.length > 20) {
      return trimmed.slice(0, 20);
    }
    if (trimmed.length < 5) {
      return trimmed + '的神秘物品';
    }
    return trimmed;
  }
}

