export interface GameState {
  userId: string;
  currentHP: number;
  maxHP: number;
  gold: number;
  items: string[];
  level: number;
  attack: number;
  experience: number;
  storyFlags: Record<string, boolean | number | string>;
  lastAction?: string;
  lastActionTime?: Date;
  currentEvent?: {
    description: string;
    eventType: string;
    options: Array<{
      text: string;
      action: string;
      effects: any;
    }>;
  };
  gameCompleted: boolean;
}

export type GameAction = 'explore' | 'status' | 'town' | 'choice';

export interface GameEvent {
  description: string;
  options: GameOption[];
  eventType: 'encounter' | 'treasure' | 'npc' | 'combat' | 'boss' | 'mystery' | 'trap';
}

export interface GameOption {
  text: string;
  action: string;
  effects: GameEffects;
}

export interface GameEffects {
  hp?: number;
  gold?: number;
  experience?: number;
  items?: {
    add?: string[];
    remove?: string[];
  };
  storyFlags?: Record<string, boolean | number | string>;
}

export interface GameChoice {
  eventId: string;
  optionIndex: number;
}

export interface TownAction {
  type: 'shop' | 'heal' | 'quest';
  description: string;
  cost?: number;
  effects?: GameEffects;
}

// 計算等級對應的最大血量和攻擊力
export function getLevelStats(level: number): { maxHP: number; attack: number } {
  // 基礎值 + 每級成長
  const maxHP = 100 + (level - 1) * 20; // 每級 +20 HP
  const attack = 10 + (level - 1) * 5; // 每級 +5 攻擊力
  return { maxHP, attack };
}

// 計算升級所需經驗值
export function getExpRequiredForLevel(level: number): number {
  // 每級所需經驗值遞增：100, 200, 300, 400...
  return level * 100;
}

export const INITIAL_STATE: Omit<GameState, 'userId'> = {
  currentHP: 100,
  maxHP: 100,
  gold: 50,
  items: ['藥草'],
  level: 1,
  attack: 10,
  experience: 0,
  storyFlags: {
    bossDefeated: false,
    questsCompleted: 0,
  },
  gameCompleted: false,
};

