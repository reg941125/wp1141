import GameState, { IGameState } from '@/lib/db/models/GameState';
import { GameState as GameStateType, GameEffects, INITIAL_STATE, getLevelStats, getExpRequiredForLevel } from './types';
import connectDB from '@/lib/db/connection';
import { formatItems } from './utils';

export async function getGameState(userId: string): Promise<GameStateType> {
  await connectDB();
  
  let gameState = await GameState.findOne({ userId });
  
  if (!gameState) {
    gameState = await GameState.create({
      userId,
      ...INITIAL_STATE,
    });
  }
  
  // Migrate old records that don't have level, attack, experience
  if (gameState.level === undefined || gameState.level === null) {
    gameState.level = INITIAL_STATE.level;
    gameState.attack = INITIAL_STATE.attack;
    gameState.experience = INITIAL_STATE.experience;
    // Update maxHP and attack based on level
    const stats = getLevelStats(gameState.level);
    gameState.maxHP = stats.maxHP;
    gameState.attack = stats.attack;
    await gameState.save();
  }
  
  return {
    userId: gameState.userId,
    currentHP: gameState.currentHP,
    maxHP: gameState.maxHP,
    gold: gameState.gold,
    items: gameState.items,
    level: gameState.level || INITIAL_STATE.level,
    attack: gameState.attack || INITIAL_STATE.attack,
    experience: gameState.experience ?? INITIAL_STATE.experience,
    storyFlags: gameState.storyFlags,
    lastAction: gameState.lastAction,
    lastActionTime: gameState.lastActionTime,
    currentEvent: gameState.currentEvent as any,
    gameCompleted: gameState.gameCompleted,
  };
}

export async function updateGameState(
  userId: string,
  effects: GameEffects,
  action?: string
): Promise<GameStateType> {
  await connectDB();
  
  const gameState = await GameState.findOne({ userId });
  if (!gameState) {
    throw new Error('Game state not found');
  }
  
  // Migrate old records that don't have level, attack, experience
  if (gameState.level === undefined || gameState.level === null) {
    gameState.level = INITIAL_STATE.level;
    gameState.attack = INITIAL_STATE.attack;
    gameState.experience = INITIAL_STATE.experience;
    // Update maxHP and attack based on level
    const stats = getLevelStats(gameState.level);
    gameState.maxHP = stats.maxHP;
    gameState.attack = stats.attack;
  }
  
  // Apply HP changes
  if (effects.hp !== undefined) {
    gameState.currentHP = Math.max(0, Math.min(gameState.maxHP, gameState.currentHP + effects.hp));
  }
  
  // Apply gold changes
  if (effects.gold !== undefined) {
    gameState.gold = Math.max(0, gameState.gold + effects.gold);
  }
  
  // Apply item changes
  if (effects.items) {
    if (effects.items.add) {
      gameState.items.push(...effects.items.add);
    }
    if (effects.items.remove) {
      gameState.items = gameState.items.filter(
        (item) => !effects.items!.remove!.includes(item)
      );
    }
  }
  
  // Apply experience changes and handle level up
  let levelUpMessage = '';
  if (effects.experience !== undefined) {
    const oldLevel = gameState.level || 1;
    gameState.experience = Math.max(0, (gameState.experience || 0) + effects.experience);
    
    // Check for level up
    while (gameState.experience >= getExpRequiredForLevel(gameState.level || 1)) {
      gameState.experience -= getExpRequiredForLevel(gameState.level || 1);
      gameState.level = (gameState.level || 1) + 1;
      
      // Update maxHP and attack based on new level
      const newStats = getLevelStats(gameState.level);
      gameState.maxHP = newStats.maxHP;
      gameState.attack = newStats.attack;
      
      // Restore full HP on level up
      gameState.currentHP = gameState.maxHP;
      
      levelUpMessage += `\n🎉 升級！等級 ${oldLevel} → ${gameState.level}！\n`;
      levelUpMessage += `✨ 最大HP: ${oldLevel === 1 ? INITIAL_STATE.maxHP : getLevelStats(oldLevel).maxHP} → ${gameState.maxHP}\n`;
      levelUpMessage += `⚔️ 攻擊力: ${oldLevel === 1 ? INITIAL_STATE.attack : getLevelStats(oldLevel).attack} → ${gameState.attack}\n`;
      levelUpMessage += `❤️ HP 已完全恢復！\n`;
      
      console.log(`Level up! New level: ${gameState.level}, MaxHP: ${gameState.maxHP}, Attack: ${gameState.attack}`);
    }
  }
  
  // Apply story flag changes
  if (effects.storyFlags) {
    gameState.storyFlags = {
      ...gameState.storyFlags,
      ...effects.storyFlags,
    };
  }
  
  // Update last action
  if (action) {
    gameState.lastAction = action;
    gameState.lastActionTime = new Date();
  }
  
  // Check for game completion
  if (gameState.storyFlags.bossDefeated === true) {
    gameState.gameCompleted = true;
  }
  
  await gameState.save();
  
  const result: GameStateType & { levelUpMessage?: string } = {
    userId: gameState.userId,
    currentHP: gameState.currentHP,
    maxHP: gameState.maxHP,
    gold: gameState.gold,
    items: gameState.items,
    level: gameState.level || 1,
    attack: gameState.attack || 10,
    experience: gameState.experience || 0,
    storyFlags: gameState.storyFlags,
    lastAction: gameState.lastAction,
    lastActionTime: gameState.lastActionTime,
    currentEvent: gameState.currentEvent as any,
    gameCompleted: gameState.gameCompleted,
  };
  
  // Add level up message if exists
  if (levelUpMessage) {
    (result as any).levelUpMessage = levelUpMessage;
  }
  
  return result;
}

export async function checkGameOver(userId: string): Promise<boolean> {
  await connectDB();
  
  const gameState = await GameState.findOne({ userId });
  if (!gameState) {
    return false;
  }
  
  return gameState.gameCompleted || gameState.currentHP <= 0;
}

export async function resetGame(userId: string): Promise<GameStateType> {
  await connectDB();
  
  const gameState = await GameState.findOne({ userId });
  
  if (gameState) {
    gameState.currentHP = INITIAL_STATE.maxHP;
    gameState.maxHP = INITIAL_STATE.maxHP;
    gameState.gold = INITIAL_STATE.gold;
    gameState.items = [...INITIAL_STATE.items];
    gameState.level = INITIAL_STATE.level;
    gameState.attack = INITIAL_STATE.attack;
    gameState.experience = INITIAL_STATE.experience;
    gameState.storyFlags = { ...INITIAL_STATE.storyFlags };
    gameState.lastAction = undefined;
    gameState.lastActionTime = undefined;
    gameState.currentEvent = undefined;
    gameState.gameCompleted = false;
    await gameState.save();
    
    return {
      userId: gameState.userId,
      currentHP: gameState.currentHP,
      maxHP: gameState.maxHP,
      gold: gameState.gold,
      items: gameState.items,
      level: gameState.level,
      attack: gameState.attack,
      experience: gameState.experience,
      storyFlags: gameState.storyFlags,
      lastAction: gameState.lastAction,
      lastActionTime: gameState.lastActionTime,
      currentEvent: gameState.currentEvent as any,
      gameCompleted: gameState.gameCompleted,
    };
  } else {
    return getGameState(userId);
  }
}

export function formatStatusMessage(state: GameStateType): string {
  const hpBar = '█'.repeat(Math.floor((state.currentHP / state.maxHP) * 10));
  const hpPercent = Math.floor((state.currentHP / state.maxHP) * 100);
  const expRequired = getExpRequiredForLevel(state.level);
  const expBar = '█'.repeat(Math.floor((state.experience / expRequired) * 10));
  const expPercent = Math.floor((state.experience / expRequired) * 100);
  
  let message = `📊 冒險者狀態\n\n`;
  message += `⭐ 等級: ${state.level}\n`;
  message += `⚔️ 攻擊力: ${state.attack}\n`;
  message += `❤️ HP: ${state.currentHP}/${state.maxHP} [${hpBar}] ${hpPercent}%\n`;
  message += `💰 金幣: ${state.gold}\n`;
  message += `✨ 經驗值: ${state.experience}/${expRequired} [${expBar}] ${expPercent}%\n`;
  message += `🎒 道具: ${formatItems(state.items)}\n`;
  
  if (state.gameCompleted) {
    message += `\n🎉 恭喜！你已經擊敗最終 Boss！`;
  } else if (state.currentHP <= 0) {
    message += `\n💀 你已經死亡，遊戲結束。`;
  }
  
  return message;
}

