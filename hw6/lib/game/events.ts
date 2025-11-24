import { generateEvent, generateChoiceResult } from '@/lib/gemini/client';
import { getGameState, updateGameState, formatStatusMessage } from './engine';
import type { GameState, GameEvent, GameAction } from './types';
import { getExpRequiredForLevel } from './types';
import GameStateModel from '@/lib/db/models/GameState';
import { getItemEffect, canUseItem } from './items';
import { formatItems, getItemCount } from './utils';

export async function handleExplore(userId: string, userInput?: string): Promise<{
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
    const event = await generateEvent(gameState, 'explore', userInput);
    
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
      quickReplyItems.push({
        type: 'action',
        action: {
          type: 'postback',
          label: `查看 ${itemName}${countDisplay}`,
          data: `inspect_item_${userId}_${itemName}`,
          displayText: `查看 ${itemName}`,
        },
      });
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
  
  const expRequired = getExpRequiredForLevel(newState.level);
  message += `\n當前狀態：\n`;
  message += `⭐ 等級: ${newState.level}\n`;
  message += `⚔️ 攻擊力: ${newState.attack}\n`;
  message += `❤️ HP: ${newState.currentHP}/${newState.maxHP}\n`;
  message += `✨ 經驗值: ${newState.experience}/${expRequired}\n`;
  message += `💰 金幣: ${newState.gold}\n`;
  message += `🎒 道具: ${formatItems(newState.items)}\n`;
  
  return {
    message,
    quickReply: getQuickReplyButtons(),
  };
}

export async function handleInspectItem(
  userId: string,
  itemName: string
): Promise<{
  message: string;
  quickReply?: any;
}> {
  const gameState = await getGameState(userId);
  const itemCount = getItemCount(gameState.items, itemName);
  
  if (itemCount === 0) {
    return {
      message: `❌ 你沒有「${itemName}」這個道具。`,
      quickReply: getQuickReplyButtons(),
    };
  }
  
  const { getItemIntroduction } = await import('./items');
  const intro = await getItemIntroduction(itemName);
  const countDisplay = itemCount > 1 ? `（持有 ${itemCount} 個）` : '';
  const message = `📦 「${itemName}」${countDisplay}\n${intro}`;
  
  return {
    message,
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '🎒 返回背包',
            data: 'action_inventory',
            displayText: '查看背包',
          },
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '📊 查看狀態',
            data: 'action_status',
            displayText: '查看狀態',
          },
        },
      ],
    },
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
  
  // Use fixed town script, no LLM needed
  await updateGameState(userId, {}, 'town');
  
  const townMessage = `🏘️ 你來到了繁華的城鎮，這裡有商店、治療所和任務公會。

請選擇你要前往的地方：`;

  const townQuickReply = {
    items: [
      {
        type: 'action',
        action: {
          type: 'postback',
          label: '🛒 前往商店',
          data: 'town_shop',
          displayText: '前往商店',
        },
      },
      {
        type: 'action',
        action: {
          type: 'postback',
          label: '💚 前往治療所',
          data: 'town_heal',
          displayText: '前往治療所',
        },
      },
      {
        type: 'action',
        action: {
          type: 'postback',
          label: '📜 前往任務公會',
          data: 'town_quest',
          displayText: '前往任務公會',
        },
      },
      {
        type: 'action',
        action: {
          type: 'postback',
          label: '🔙 離開城鎮',
          data: 'action_explore',
          displayText: '離開城鎮',
        },
      },
    ],
  };

  return {
    message: townMessage,
    quickReply: townQuickReply,
  };
}

export async function handleQuest(userId: string): Promise<{
  message: string;
  quickReply?: any;
}> {
  const gameState = await getGameState(userId);
  
  try {
    // Generate quest using LLM
    const { generateQuest } = await import('@/lib/gemini/questGenerator');
    const quest = await generateQuest(gameState);
    
    // Store quest in game state for acceptance/rejection
    await GameStateModel.updateOne(
      { userId },
      {
        $set: {
          currentEvent: {
            description: quest.description,
            eventType: 'quest',
            questData: quest,
            options: [
              {
                text: '接受任務',
                action: 'accept_quest',
                effects: {
                  experience: quest.rewards.experience,
                  gold: quest.rewards.gold,
                  items: quest.rewards.items ? { add: quest.rewards.items } : undefined,
                  storyFlags: { questsCompleted: ((gameState.storyFlags.questsCompleted as number) || 0) + 1 },
                },
              },
              {
                text: '放棄任務',
                action: 'reject_quest',
                effects: {},
              },
            ],
          },
        },
      }
    );
    
    let message = `📜 任務公會\n\n`;
    message += `${quest.description}\n\n`;
    message += `任務類型：${quest.taskType}\n`;
    message += `難度：${quest.difficulty}\n\n`;
    message += `獎勵：\n`;
    message += `✨ 經驗值：+${quest.rewards.experience}\n`;
    message += `💰 金幣：+${quest.rewards.gold}\n`;
    if (quest.rewards.items && quest.rewards.items.length > 0) {
      message += `🎒 道具：${quest.rewards.items.join(', ')}\n`;
    }
    message += `\n你要接受這個任務嗎？`;
    
    const questQuickReply = {
      items: [
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '✅ 接受任務',
            data: `quest_accept_${userId}`,
            displayText: '接受任務',
          },
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '❌ 放棄任務',
            data: `quest_reject_${userId}`,
            displayText: '放棄任務',
          },
        },
      ],
    };
    
    return {
      message,
      quickReply: questQuickReply,
    };
  } catch (error) {
    console.error('Error handling quest:', error);
    return {
      message: '任務公會暫時無法提供任務，請稍後再試。',
      quickReply: {
        items: [
          {
            type: 'action',
            action: {
              type: 'postback',
              label: '🔙 返回城鎮',
              data: 'action_town',
              displayText: '返回城鎮',
            },
          },
        ],
      },
    };
  }
}

export async function handleQuestAccept(userId: string): Promise<{
  message: string;
  questEventMessage?: string;
  quickReply?: any;
}> {
  const gameState = await getGameState(userId);
  
  try {
    const currentEvent = gameState.currentEvent;
    
    if (!currentEvent || currentEvent.eventType !== 'quest') {
      return {
        message: '沒有可接受的任務。',
        quickReply: getQuickReplyButtons(),
      };
    }
    
    // Find accept option
    const acceptOption = currentEvent.options?.find(opt => opt.action === 'accept_quest');
    
    if (!acceptOption) {
      return {
        message: '任務選項無效。',
        quickReply: getQuickReplyButtons(),
      };
    }
    
    // Apply quest rewards first
    const newState = await updateGameState(userId, acceptOption.effects, 'quest_accept');
    const questData = (currentEvent as any).questData;
    
    // Generate quest execution event
    const { generateEvent } = await import('@/lib/gemini/client');
    const questEvent = await generateEvent(newState, 'explore', `執行任務：${questData.taskType}`);
    
    // Store the quest event with a marker to indicate it's a quest event
    await GameStateModel.updateOne(
      { userId },
      {
        $set: {
          currentEvent: {
            description: questEvent.description,
            eventType: questEvent.eventType,
            options: questEvent.options,
            isQuestEvent: true, // Mark this as a quest event
          },
        },
      }
    );
    
    // Build acceptance message (first message)
    let acceptanceMessage = `✅ 你接受了任務！\n\n`;
    acceptanceMessage += `任務：${questData.description}\n\n`;
    
    // Show rewards received
    const rewards: string[] = [];
    if (acceptOption.effects.experience) {
      rewards.push(`經驗值 +${acceptOption.effects.experience}`);
    }
    if (acceptOption.effects.gold) {
      rewards.push(`金幣 +${acceptOption.effects.gold}`);
    }
    if (acceptOption.effects.items?.add) {
      rewards.push(`獲得：${acceptOption.effects.items.add.join(', ')}`);
    }
    if (rewards.length > 0) {
      acceptanceMessage += `獎勵：${rewards.join('、')}\n\n`;
    }
    
    // Add level up message if exists
    if ((newState as any).levelUpMessage) {
      acceptanceMessage += (newState as any).levelUpMessage + '\n\n';
    }
    
    acceptanceMessage += `當前狀態：\n`;
    acceptanceMessage += `⭐ 等級: ${newState.level}\n`;
    acceptanceMessage += `⚔️ 攻擊力: ${newState.attack}\n`;
    acceptanceMessage += `❤️ HP: ${newState.currentHP}/${newState.maxHP}\n`;
    const expRequired = getExpRequiredForLevel(newState.level);
    acceptanceMessage += `✨ 經驗值: ${newState.experience}/${expRequired}\n`;
    acceptanceMessage += `💰 金幣: ${newState.gold}\n`;
    acceptanceMessage += `🎒 道具: ${formatItems(newState.items)}`;
    
    // Build quest event message (second message)
    let questMessage = questEvent.description;
    questMessage += `\n\n你要怎麼做？\n\n`;
    
    // List options in message
    questEvent.options.forEach((option: any, index: number) => {
      questMessage += `${index + 1}. ${option.text}\n`;
    });
    
    // Format quest event options with label length limit (Line API limit: 20 characters)
    const questQuickReply = {
      items: questEvent.options.map((option: any, index: number) => ({
        type: 'action',
        action: {
          type: 'postback',
          label: option.text.length > 20 ? option.text.substring(0, 17) + '...' : option.text,
          data: `choice_${userId}_${index}`,
          displayText: option.text,
        },
      })),
    };
    
    // Return both messages - handlers.ts will send them separately
    return {
      message: acceptanceMessage,
      questEventMessage: questMessage,
      quickReply: questQuickReply,
    };
  } catch (error) {
    console.error('Error accepting quest:', error);
    return {
      message: '接受任務時發生錯誤，請稍後再試。',
      quickReply: getQuickReplyButtons(),
    };
  }
}

export async function handleQuestReject(userId: string): Promise<{
  message: string;
  quickReply?: any;
}> {
  // Clear quest event
  await GameStateModel.updateOne(
    { userId },
    { $unset: { currentEvent: '' } }
  );
  
  // Return to town menu
  return handleTown(userId);
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
    if (selectedOption.effects.experience) {
      effects.push(`經驗值 +${selectedOption.effects.experience}`);
    }
    if (selectedOption.effects.gold) {
      effects.push(`金幣 ${selectedOption.effects.gold > 0 ? '+' : ''}${selectedOption.effects.gold}`);
    }
    if (selectedOption.effects.items?.add) {
      // Format items with counts if multiple
      const addedItems = selectedOption.effects.items.add;
      const addedCounts: Record<string, number> = {};
      addedItems.forEach((item: string) => {
        addedCounts[item] = (addedCounts[item] || 0) + 1;
      });
      const formattedAdded = Object.entries(addedCounts)
        .map(([name, count]) => count > 1 ? `${name} * ${count}` : name)
        .join(', ');
      if (formattedAdded) {
        effects.push(`獲得：${formattedAdded}`);
      }
    }
    if (selectedOption.effects.items?.remove) {
      const removedItems = selectedOption.effects.items.remove;
      const removedCounts: Record<string, number> = {};
      removedItems.forEach((item: string) => {
        removedCounts[item] = (removedCounts[item] || 0) + 1;
      });
      const formattedRemoved = Object.entries(removedCounts)
        .map(([name, count]) => count > 1 ? `${name} * ${count}` : name)
        .join(', ');
      if (formattedRemoved) {
        effects.push(`失去：${formattedRemoved}`);
      }
    }
    
    if (effects.length > 0) {
      message += `效果：${effects.join('、')}\n\n`;
    }
    
    // Add level up message if exists
    if ((newState as any).levelUpMessage) {
      message += (newState as any).levelUpMessage;
    }
    
    // Always show current state after action
    const expRequired = getExpRequiredForLevel(newState.level);
    message += `當前狀態：\n`;
    message += `⭐ 等級: ${newState.level}\n`;
    message += `⚔️ 攻擊力: ${newState.attack}\n`;
    message += `❤️ HP: ${newState.currentHP}/${newState.maxHP}\n`;
    message += `✨ 經驗值: ${newState.experience}/${expRequired}\n`;
    message += `💰 金幣: ${newState.gold}\n`;
    message += `🎒 道具: ${formatItems(newState.items)}\n`;
    
    // Check for game over
    if (newState.gameCompleted) {
      message += `\n🎉 恭喜！你擊敗了最終 Boss，完成遊戲！`;
      // Clear current event
      await GameStateModel.updateOne(
        { userId },
        { $unset: { currentEvent: '' } }
      );
      return {
        message,
        quickReply: getQuickReplyButtons(),
      };
    } else if (newState.currentHP <= 0) {
      message += `\n💀 你的 HP 歸零，遊戲結束。`;
      // Clear current event
      await GameStateModel.updateOne(
        { userId },
        { $unset: { currentEvent: '' } }
      );
      return {
        message,
        quickReply: getQuickReplyButtons(),
      };
    }
    
    // Check if this is a quest event
    const isQuestEvent = (currentEvent as any).isQuestEvent === true;
    
    // If this was a quest event, complete it and return to town
    if (isQuestEvent) {
      // Clear current event
      await GameStateModel.updateOne(
        { userId },
        { $unset: { currentEvent: '' } }
      );
      
      message += `\n\n✅ 任務完成！返回城鎮。`;
      const townResponse = await handleTown(userId);
      return {
        message: message + '\n\n' + townResponse.message,
        quickReply: townResponse.quickReply,
      };
    }
    
    // Normal event handling (not a quest event)
    // If choice result suggests a follow-up event, store it but don't show immediately
    if (choiceResult.shouldGenerateFollowUp) {
      const followUpEvent = await generateEvent(newState, 'explore');
      
      // Store the new event for next exploration
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
      
      // Show result and let user choose next action
      message += `\n\n你發現了新的情況，繼續探索吧！`;
    } else {
      // Clear current event
      await GameStateModel.updateOne(
        { userId },
        { $unset: { currentEvent: '' } }
      );
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
        displayText: '查看狀態',
      },
    },
    {
      type: 'action',
      action: {
        type: 'postback',
        label: '🎒 查看背包',
        data: 'action_inventory',
        displayText: '查看背包',
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
          displayText: '探索',
        },
      },
      {
        type: 'action',
        action: {
          type: 'postback',
          label: '📊 查看狀態',
          data: 'action_status',
          displayText: '查看狀態',
        },
      },
      {
        type: 'action',
        action: {
          type: 'postback',
          label: '🎒 查看背包',
          data: 'action_inventory',
          displayText: '查看背包',
        },
      },
      {
        type: 'action',
        action: {
          type: 'postback',
          label: '🏘️ 前往城鎮',
          data: 'action_town',
          displayText: '前往城鎮',
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

