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

export function getItemEffect(itemName: string): ItemEffect | null {
  return ITEM_EFFECTS[itemName] || null;
}

export function canUseItem(itemName: string): boolean {
  const effect = getItemEffect(itemName);
  if (!effect) return false;
  // 只有有 HP 或金幣效果的道具才能使用
  return effect.hp !== undefined || effect.gold !== undefined;
}

