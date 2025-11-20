import { generateEvent, generateChoiceResult } from '@/lib/gemini/client';
import { getGameState, updateGameState, formatStatusMessage } from './engine';
import type { GameState, GameEvent, GameAction } from './types';
import GameStateModel from '@/lib/db/models/GameState';
import { getItemEffect, canUseItem } from './items';
import { formatItems, getItemCount } from './utils';

export async function handleExplore(userId: string): Promise<{
  message: string;
  quickReply?: any;
}> {
  const gameState = await getGameState(userId);
  
  // Check if game is over
  if (gameState.gameCompleted) {
    return {
      message: '🎉 恭喜！你已經擊敗最終 Boss，完成遊戲！\n\n輸入「重新開始」來開始新的冒險。',
    };
  }
  
  if (gameState.currentHP <= 0) {
    return {
      message: '💀 你已經死亡，遊戲結束。\n\n輸入「重新開始」來開始新的冒險。',
    };
  }
  
  try {
    const event = await generateEvent(gameState, 'explore');
    
    // Store event in game state for choice processing
    const updatedState = await updateGameState(userId, {}, 'explore');
    // Also store the current event
    await GameStateModel.updateOne(
      { userId },
      { 
        $set: { 
          currentEvent: {
            description: event.description,
            eventType: event.eventType,
            options: event.options,
          }
        }
      }
    );
    
    return formatEventMessage(event, userId);
  } catch (error) {
    console.error('Error handling explore:', error);
    return {
      message: '探索時發生了錯誤，請稍後再試。',
    };
  }
}

export async function handleStatus(userId: string): Promise<{
  message: string;
  quickReply?: any;
}> {
  const gameState = await getGameState(userId);
  const statusMessage = formatStatusMessage(gameState);
  
  return {
    message: statusMessage,
    quickReply: getQuickReplyButtons(),
  };
}

export async function handleInventory(userId: string): Promise<{
  message: string;
  quickReply?: any;
}> {
  const gameState = await getGameState(userId);
  
  if (gameState.items.length === 0) {
    return {
      message: '🎒 背包是空的\n\n你目前沒有任何道具。',
      quickReply: getQuickReplyButtons(),
    };
  }
  
  // Group items by name and count
  const itemCounts: Record<string, number> = {};
  gameState.items.forEach((item) => {
    itemCounts[item] = (itemCounts[item] || 0) + 1;
  });
  
  let message = '🎒 背包內容\n\n';
  
  // Create quick reply items for usable items
  const quickReplyItems: any[] = [];
  
  Object.entries(itemCounts).forEach(([itemName, count]) => {
    const effect = getItemEffect(itemName);
    const usable = canUseItem(itemName);
    const countDisplay = count > 1 ? ` * ${count}` : '';
    
    if (usable) {
      message += `✅ ${itemName}${countDisplay} - ${effect?.description || '可使用'}\n`;
      quickReplyItems.push({
        type: 'action',
        action: {
          type: 'postback',
          label: `使用 ${itemName}${countDisplay}`,
          data: `use_item_${userId}_${itemName}`,
          displayText: `使用 ${itemName}`,
        },
      });
    } else {
      message += `📦 ${itemName}${countDisplay} - ${effect?.description || '道具'}\n`;
    }
  });
  
  // Add back button
  quickReplyItems.push({
    type: 'action',
    action: {
      type: 'postback',
      label: '🔙 返回',
      data: 'action_status',
    },
  });
  
  return {
    message,
    quickReply: {
      items: quickReplyItems,
    },
  };
}

export async function handleUseItem(
  userId: string,
  itemName: string
): Promise<{
  message: string;
  quickReply?: any;
}> {
  const gameState = await getGameState(userId);
  
  // Check if item exists
  const itemCount = getItemCount(gameState.items, itemName);
  if (itemCount === 0) {
    return {
      message: `❌ 你沒有「${itemName}」這個道具。`,
      quickReply: getQuickReplyButtons(),
    };
  }
  
  // Check if item can be used
  if (!canUseItem(itemName)) {
    return {
      message: `❌ 「${itemName}」無法直接使用。`,
      quickReply: getQuickReplyButtons(),
    };
  }
  
  const effect = getItemEffect(itemName);
  if (!effect) {
    return {
      message: `❌ 「${itemName}」沒有定義效果。`,
      quickReply: getQuickReplyButtons(),
    };
  }
  
  // Apply item effects
  const effects: any = {
    items: {
      remove: [itemName],
    },
  };
  
  if (effect.hp !== undefined) {
    effects.hp = effect.hp;
  }
  
  if (effect.gold !== undefined) {
    effects.gold = effect.gold;
  }
  
  const newState = await updateGameState(userId, effects, `use_item_${itemName}`);
  
  // Build response message
  let message = `✅ 你使用了「${itemName}」\n\n`;
  message += `效果：${effect.description}\n\n`;
  
  if (effect.hp) {
    const hpChange = effect.hp > 0 ? `+${effect.hp}` : `${effect.hp}`;
    message += `❤️ HP: ${gameState.currentHP} → ${newState.currentHP} (${hpChange})\n`;
  }
  
  if (effect.gold) {
    const goldChange = effect.gold > 0 ? `+${effect.gold}` : `${effect.gold}`;
    message += `💰 金幣: ${gameState.gold} → ${newState.gold} (${goldChange})\n`;
  }
  
  // Add level up message if exists
  if ((newState as any).levelUpMessage) {
    message += (newState as any).levelUpMessage;
  }
  
  message += `\n當前狀態：\n`;
  message += `⭐ 等級: ${newState.level}\n`;
  message += `⚔️ 攻擊力: ${newState.attack}\n`;
  message += `❤️ HP: ${newState.currentHP}/${newState.maxHP}\n`;
  message += `💰 金幣: ${newState.gold}\n`;
  message += `🎒 道具: ${formatItems(newState.items)}\n`;
  
  return {
    message,
    quickReply: getQuickReplyButtons(),
  };
}

export async function handleTown(userId: string): Promise<{
  message: string;
  quickReply?: any;
}> {
  const gameState = await getGameState(userId);
  
  if (gameState.gameCompleted) {
    return {
      message: '🎉 恭喜！你已經擊敗最終 Boss，完成遊戲！\n\n輸入「重新開始」來開始新的冒險。',
    };
  }
  
  if (gameState.currentHP <= 0) {
    return {
      message: '💀 你已經死亡，遊戲結束。\n\n輸入「重新開始」來開始新的冒險。',
    };
  }
  
  try {
    const event = await generateEvent(gameState, 'town');
    
    await updateGameState(userId, {}, 'town');
    // Store the current event
    await GameStateModel.updateOne(
      { userId },
      { 
        $set: { 
          currentEvent: {
            description: event.description,
            eventType: event.eventType,
            options: event.options,
          }
        }
      }
    );
    
    return formatEventMessage(event, userId);
  } catch (error) {
    console.error('Error handling town:', error);
    return {
      message: '前往城鎮時發生了錯誤，請稍後再試。',
    };
  }
}

export async function handleChoice(
  userId: string,
  eventId: string,
  optionIndex: number
): Promise<{
  message: string;
  quickReply?: any;
}> {
  const gameState = await getGameState(userId);
  
  try {
    // Get the current event from game state
    let currentEvent = gameState.currentEvent;
    
    // If no current event stored, regenerate it (fallback)
    if (!currentEvent) {
      const lastAction = gameState.lastAction || 'explore';
      const event = await generateEvent(gameState, lastAction);
      currentEvent = {
        description: event.description,
        eventType: event.eventType,
        options: event.options,
      };
    }
    
    if (optionIndex < 0 || optionIndex >= currentEvent.options.length) {
      return {
        message: '無效的選項，請重新選擇。',
        quickReply: getQuickReplyButtons(),
      };
    }
    
    const selectedOption = currentEvent.options[optionIndex];
    
    // Generate choice result description
    const choiceResult = await generateChoiceResult(
      gameState,
      currentEvent.description,
      selectedOption.text,
      selectedOption.effects
    );
    
    // Apply effects
    const newState = await updateGameState(userId, selectedOption.effects, `choice_${optionIndex}`);
    
    // Build response message with result description
    let message = choiceResult.resultDescription + '\n\n';
    
    // Show effects
    const effects: string[] = [];
    if (selectedOption.effects.hp) {
      effects.push(`HP ${selectedOption.effects.hp > 0 ? '+' : ''}${selectedOption.effects.hp}`);
    }
    if (selectedOption.effects.gold) {
      effects.push(`金幣 ${selectedOption.effects.gold > 0 ? '+' : ''}${selectedOption.effects.gold}`);
    }
    if (selectedOption.effects.items?.add) {
      // Format items with counts if multiple
      const addedItems = selectedOption.effects.items.add;
      const addedCounts: Record<string, number> = {};
      addedItems.forEach((item) => {
        addedCounts[item] = (addedCounts[item] || 0) + 1;
      });
      const formattedAdded = Object.entries(addedCounts)
        .map(([name, count]) => count > 1 ? `${name} * ${count}` : name)
        .join(', ');
      effects.push(`獲得：${formattedAdded}`);
    }
    if (selectedOption.effects.items?.remove) {
      const removedItems = selectedOption.effects.items.remove;
      const removedCounts: Record<string, number> = {};
      removedItems.forEach((item) => {
        removedCounts[item] = (removedCounts[item] || 0) + 1;
      });
      const formattedRemoved = Object.entries(removedCounts)
        .map(([name, count]) => count > 1 ? `${name} * ${count}` : name)
        .join(', ');
      effects.push(`失去：${formattedRemoved}`);
    }
    
    if (effects.length > 0) {
      message += `效果：${effects.join('、')}\n\n`;
    }
    
    // If choice result suggests a follow-up event, generate it
    if (choiceResult.shouldGenerateFollowUp) {
      const followUpEvent = await generateEvent(newState, 'explore');
      
      // Store the new event
      await GameStateModel.updateOne(
        { userId },
        { 
          $set: { 
            currentEvent: {
              description: followUpEvent.description,
              eventType: followUpEvent.eventType,
              options: followUpEvent.options,
            }
          }
        }
      );
      
      // Return the follow-up event
      return formatEventMessage(followUpEvent, userId);
    }
    
    // Clear current event
    await GameStateModel.updateOne(
      { userId },
      { $unset: { currentEvent: '' } }
    );
    
    // Add level up message if exists
    if ((newState as any).levelUpMessage) {
      message += (newState as any).levelUpMessage;
    }
    
    message += `當前狀態：\n`;
    message += `⭐ 等級: ${newState.level}\n`;
    message += `⚔️ 攻擊力: ${newState.attack}\n`;
    message += `❤️ HP: ${newState.currentHP}/${newState.maxHP}\n`;
    message += `💰 金幣: ${newState.gold}\n`;
    
    // Check for game over
    if (newState.gameCompleted) {
      message += `\n🎉 恭喜！你擊敗了最終 Boss，完成遊戲！`;
    } else if (newState.currentHP <= 0) {
      message += `\n💀 你的 HP 歸零，遊戲結束。`;
    } else {
      message += `\n\n繼續你的冒險吧！`;
    }
    
    return {
      message,
      quickReply: getQuickReplyButtons(),
    };
  } catch (error) {
    console.error('Error handling choice:', error);
    return {
      message: '處理選擇時發生了錯誤，請稍後再試。',
      quickReply: getQuickReplyButtons(),
    };
  }
}

function formatEventMessage(event: GameEvent, userId: string): {
  message: string;
  quickReply?: any;
} {
  let message = `${event.description}\n\n`;
  message += `你要怎麼做？\n\n`;
  
  event.options.forEach((option, index) => {
    message += `${index + 1}. ${option.text}\n`;
  });
  
  // Create quick reply buttons for options
  const quickReplyItems = event.options.map((option, index) => ({
    type: 'action',
    action: {
      type: 'postback',
      label: option.text.length > 20 ? option.text.substring(0, 17) + '...' : option.text,
      data: `choice_${userId}_${index}`,
      displayText: option.text,
    },
  }));
  
  // Add main action buttons
  quickReplyItems.push(
    {
      type: 'action',
      action: {
        type: 'postback',
        label: '📊 查看狀態',
        data: 'action_status',
      },
    },
    {
      type: 'action',
      action: {
        type: 'postback',
        label: '🎒 查看背包',
        data: 'action_inventory',
      },
    }
  );
  
  return {
    message,
    quickReply: {
      items: quickReplyItems,
    },
  };
}

export function getQuickReplyButtons() {
  return {
    items: [
      {
        type: 'action',
        action: {
          type: 'postback',
          label: '1️⃣ 探索',
          data: 'action_explore',
        },
      },
      {
        type: 'action',
        action: {
          type: 'postback',
          label: '📊 查看狀態',
          data: 'action_status',
        },
      },
      {
        type: 'action',
        action: {
          type: 'postback',
          label: '🎒 查看背包',
          data: 'action_inventory',
        },
      },
      {
        type: 'action',
        action: {
          type: 'postback',
          label: '🏘️ 前往城鎮',
          data: 'action_town',
        },
      },
    ],
  };
}

export function handleReset(userId: string): Promise<{
  message: string;
  quickReply?: any;
}> {
  return new Promise(async (resolve) => {
    const { resetGame } = await import('./engine');
    await resetGame(userId);
    resolve({
      message: '🎮 遊戲已重置！開始新的冒險吧！\n\n使用下方的按鈕開始探索。',
      quickReply: getQuickReplyButtons(),
    });
  });
}

