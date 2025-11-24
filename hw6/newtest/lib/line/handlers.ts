import { WebhookEvent, MessageEvent, PostbackEvent } from '@line/bot-sdk';
import { lineClient, getClient } from './client';
import {
  handleExplore,
  handleStatus,
  handleTown,
  handleChoice,
  handleReset,
  handleInventory,
  handleUseItem,
  handleQuest,
  handleQuestAccept,
  handleQuestReject,
  getQuickReplyButtons,
} from '@/lib/game/events';
import Conversation from '@/lib/db/models/Conversation';
import connectDB from '@/lib/db/connection';
import { checkUserRateLimit } from '@/lib/utils/rateLimit';
import { RateLimitError, handleLLMError, handleDatabaseError, getFallbackMessage } from '@/lib/utils/errors';
import { sendProcessingMessage, getProcessingMessage, delay } from '@/lib/utils/delayedResponse';
import { parseUserInput } from '@/lib/gemini/textParser';
import { getGameState, updateGameState } from '@/lib/game/engine';
import { formatItems } from '@/lib/game/utils';

export async function handleTextMessage(event: MessageEvent): Promise<void> {
  if (event.message.type !== 'text') {
    return;
  }

  const userId = event.source.userId || '';
  const text = event.message.text.trim().toLowerCase();
  const messageId = event.message.id;

  // Check rate limit
  if (!checkUserRateLimit(userId)) {
    await lineClient.replyMessage(event.replyToken, {
      type: 'text',
      text: '⚠️ 請求過於頻繁，請稍後再試。',
    });
    return;
  }

  try {
    await connectDB();
  } catch (error) {
    console.error('Database connection error:', error);
    await lineClient.replyMessage(event.replyToken, {
      type: 'text',
      text: handleDatabaseError(error),
    });
    return;
  }

  try {
    // Save user message
    await Conversation.create({
      userId,
      messageId: `msg_${messageId}`,
      timestamp: new Date(event.timestamp * 1000),
      messageType: 'text',
      content: event.message.text,
    });

    let response: { message: string; quickReply?: any };
    let actionType = 'default';

    try {
      // Use LLM to parse user input and determine action
      try {
        const parsed = await parseUserInput(event.message.text);
        
        // Only use LLM result if confidence is high enough, otherwise fallback to keyword matching
        if (parsed.confidence >= 0.7) {
          switch (parsed.action) {
            case 'reset':
              response = await handleReset(userId);
              actionType = 'default';
              break;
            case 'explore':
              await sendProcessingMessage(event.replyToken, getProcessingMessage('explore'), 1000);
              // Pass user input to handleExplore so Gemini can generate appropriate event
              response = await handleExplore(userId, event.message.text);
              actionType = 'explore';
              break;
            case 'status':
              await sendProcessingMessage(event.replyToken, getProcessingMessage('status'), 500);
              response = await handleStatus(userId);
              actionType = 'status';
              break;
            case 'inventory':
              await sendProcessingMessage(event.replyToken, getProcessingMessage('inventory'), 500);
              response = await handleInventory(userId);
              actionType = 'inventory';
              break;
            case 'town':
              await sendProcessingMessage(event.replyToken, getProcessingMessage('town'), 800);
              response = await handleTown(userId);
              actionType = 'town';
              break;
            default:
              // Fallback to explore, pass user input
              await sendProcessingMessage(event.replyToken, getProcessingMessage('explore'), 1000);
              response = await handleExplore(userId, event.message.text);
              actionType = 'explore';
          }
        } else {
          // Fallback to keyword matching
          if (text === '開始' || text === 'start' || text === '重新開始' || text === 'reset' ||
              text.includes('重置') || text.includes('重製') || text.includes('重新開始') ||
              text.includes('重來') || text.includes('從頭開始')) {
            response = await handleReset(userId);
            actionType = 'default';
          } else if (text.includes('探索') || text === 'explore' || text === '1') {
            await sendProcessingMessage(event.replyToken, getProcessingMessage('explore'), 1000);
            // Pass user input to handleExplore so Gemini can generate appropriate event
            response = await handleExplore(userId, event.message.text);
            actionType = 'explore';
          } else if (text.includes('狀態') || text.includes('status') || text === '2') {
            await sendProcessingMessage(event.replyToken, getProcessingMessage('status'), 500);
            response = await handleStatus(userId);
            actionType = 'status';
          } else if (text.includes('背包') || text.includes('inventory') || text === '3') {
            await sendProcessingMessage(event.replyToken, getProcessingMessage('inventory'), 500);
            response = await handleInventory(userId);
            actionType = 'inventory';
          } else if (text.includes('城鎮') || text.includes('town') || text === '4') {
            await sendProcessingMessage(event.replyToken, getProcessingMessage('town'), 800);
            response = await handleTown(userId);
            actionType = 'town';
          } else {
            // Default: treat as explore, pass user input
            await sendProcessingMessage(event.replyToken, getProcessingMessage('explore'), 1000);
            response = await handleExplore(userId, event.message.text);
            actionType = 'explore';
          }
        }
      } catch (parseError) {
        console.error('Error parsing user input:', parseError);
        // Fallback to keyword matching on error
        if (text === '開始' || text === 'start' || text === '重新開始' || text === 'reset' ||
            text.includes('重置') || text.includes('重製') || text.includes('重新開始') ||
            text.includes('重來') || text.includes('從頭開始')) {
          response = await handleReset(userId);
          actionType = 'default';
        } else {
          // Fallback to explore on error, pass user input
          await sendProcessingMessage(event.replyToken, getProcessingMessage('explore'), 1000);
          response = await handleExplore(userId, event.message.text);
          actionType = 'explore';
        }
      }
    } catch (error) {
      console.error('Error handling text message:', error);
      if (error instanceof RateLimitError) {
        response = {
          message: handleLLMError(error),
          quickReply: getQuickReplyButtons(),
        };
      } else {
        response = {
          message: handleLLMError(error),
          quickReply: getQuickReplyButtons(),
        };
      }
    }

    // Send actual response using pushMessage (since replyToken was already used for processing message)
    if (actionType !== 'default') {
      await getClient().pushMessage(userId, {
        type: 'text',
        text: response.message,
        quickReply: response.quickReply,
      });
    } else {
      // For default/welcome message, use replyToken
      await lineClient.replyMessage(event.replyToken, {
        type: 'text',
        text: response.message,
        quickReply: response.quickReply,
      });
    }

    // Save bot response
    await Conversation.create({
      userId,
      messageId: `reply_${Date.now()}_${Math.random()}`,
      timestamp: new Date(),
      messageType: 'text',
      content: response.message,
      response: response.message,
      metadata: { replyToken: event.replyToken },
    });
  } catch (error) {
    console.error('Unexpected error in handleTextMessage:', error);
    try {
      await lineClient.replyMessage(event.replyToken, {
        type: 'text',
        text: '⚠️ 發生錯誤，請稍後再試。',
      });
    } catch (replyError) {
      console.error('Failed to send error reply:', replyError);
    }
  }
}

export async function handlePostback(event: PostbackEvent): Promise<void> {
  const userId = event.source.userId || '';
  const data = event.postback.data;

  // Check rate limit
  if (!checkUserRateLimit(userId)) {
    await lineClient.replyMessage(event.replyToken, {
      type: 'text',
      text: '⚠️ 請求過於頻繁，請稍後再試。',
    });
    return;
  }

  try {
    await connectDB();
  } catch (error) {
    console.error('Database connection error:', error);
    await lineClient.replyMessage(event.replyToken, {
      type: 'text',
      text: handleDatabaseError(error),
    });
    return;
  }

  try {

    // Save postback event
    await Conversation.create({
      userId,
      messageId: `postback_${Date.now()}_${Math.random()}`,
      timestamp: new Date(event.timestamp * 1000),
      messageType: 'postback',
      content: data,
      metadata: { postback: event.postback },
    });

    let response: { message: string; quickReply?: any };
    let actionType = 'default';
    let processingDelay = 1000;

    try {
      // Parse postback data
      if (data.startsWith('action_')) {
        const action = data.replace('action_', '');
        actionType = action;
        
        // Send processing message first
        const processingText = getProcessingMessage(action);
        await sendProcessingMessage(event.replyToken, processingText, 
          action === 'explore' ? 2000 : 
          action === 'town' ? 1500 : 
          action === 'choice' ? 2000 : 800
        );
        
        switch (action) {
          case 'explore':
            // For postback actions, no user input available, so pass undefined
            response = await handleExplore(userId);
            break;
          case 'status':
            response = await handleStatus(userId);
            break;
          case 'inventory':
            response = await handleInventory(userId);
            break;
          case 'town':
            response = await handleTown(userId);
            break;
          default:
            response = {
              message: '未知的操作，請重新選擇。',
              quickReply: getQuickReplyButtons(),
            };
            actionType = 'default';
        }
      } else if (data.startsWith('use_item_')) {
        // Format: use_item_{userId}_{itemName}
        const parts = data.split('_');
        if (parts.length >= 4) {
          const targetUserId = parts[2];
          const itemName = parts.slice(3).join('_'); // Handle item names with underscores
          
          if (targetUserId === userId) {
            // Send processing message
            await sendProcessingMessage(event.replyToken, getProcessingMessage('use_item'), 600);
            response = await handleUseItem(userId, itemName);
            actionType = 'use_item';
          } else {
            response = {
              message: '無效的操作。',
              quickReply: getQuickReplyButtons(),
            };
          }
        } else {
          response = {
            message: '無效的道具使用格式。',
            quickReply: getQuickReplyButtons(),
          };
        }
      } else if (data === 'town_shop') {
        // Shop action
        const gameState = await getGameState(userId);
        if (gameState.gold >= 20) {
          await updateGameState(userId, {
            gold: -20,
            items: { add: ['藥草'] },
          }, 'town_shop');
          const newState = await getGameState(userId);
          response = {
            message: `🛒 商店\n\n你購買了藥草，花費了 20 金幣。\n\n當前狀態：\n💰 金幣: ${newState.gold}\n🎒 道具: ${formatItems(newState.items)}`,
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
        } else {
          response = {
            message: '🛒 商店\n\n你的金幣不足（需要 20 金幣）。',
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
        actionType = 'town';
      } else if (data === 'town_heal') {
        // Heal action
        const gameState = await getGameState(userId);
        if (gameState.gold >= 30) {
          const healAmount = Math.min(50, gameState.maxHP - gameState.currentHP);
          await updateGameState(userId, {
            gold: -30,
            hp: healAmount,
          }, 'town_heal');
          const newState = await getGameState(userId);
          response = {
            message: `💚 治療所\n\n你接受了治療，恢復了 ${healAmount} HP，花費了 30 金幣。\n\n當前狀態：\n❤️ HP: ${newState.currentHP}/${newState.maxHP}\n💰 金幣: ${newState.gold}`,
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
        } else {
          response = {
            message: '💚 治療所\n\n你的金幣不足（需要 30 金幣）。',
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
        actionType = 'town';
      } else if (data === 'town_quest') {
        // Quest action - generate quest using LLM
        await sendProcessingMessage(event.replyToken, getProcessingMessage('quest'), 1000);
        response = await handleQuest(userId);
        actionType = 'quest';
      } else if (data.startsWith('quest_accept_')) {
        // Accept quest
        const parts = data.split('_');
        if (parts.length >= 3 && parts[2] === userId) {
          await sendProcessingMessage(event.replyToken, getProcessingMessage('quest'), 1000);
          response = await handleQuestAccept(userId);
          
          // If response has questEventMessage, send two separate messages
          if ((response as any).questEventMessage) {
            // Send first message (acceptance message)
            await getClient().pushMessage(userId, {
              type: 'text',
              text: response.message,
            });
            
            // Send second message (quest event) with quickReply
            await getClient().pushMessage(userId, {
              type: 'text',
              text: (response as any).questEventMessage,
              quickReply: response.quickReply,
            });
            
            // Save both messages to conversation
            await Conversation.create({
              userId,
              messageId: `reply_${Date.now()}_${Math.random()}`,
              timestamp: new Date(),
              messageType: 'text',
              content: response.message,
              response: response.message,
              metadata: { postbackData: data, type: 'quest_accept' },
            });
            
            await Conversation.create({
              userId,
              messageId: `reply_${Date.now()}_${Math.random()}`,
              timestamp: new Date(),
              messageType: 'text',
              content: (response as any).questEventMessage,
              response: (response as any).questEventMessage,
              metadata: { postbackData: data, type: 'quest_event' },
            });
            
            // Don't send response again in the normal flow
            actionType = 'quest_sent';
            return;
          }
          
          actionType = 'quest';
        } else {
          response = {
            message: '無效的任務操作。',
            quickReply: getQuickReplyButtons(),
          };
        }
      } else if (data.startsWith('quest_reject_')) {
        // Reject quest - return to town
        const parts = data.split('_');
        if (parts.length >= 3 && parts[2] === userId) {
          response = await handleQuestReject(userId);
          actionType = 'town';
        } else {
          response = {
            message: '無效的任務操作。',
            quickReply: getQuickReplyButtons(),
          };
        }
      } else if (data.startsWith('choice_')) {
        // Format: choice_{userId}_{optionIndex}
        const parts = data.split('_');
        if (parts.length >= 3) {
          const targetUserId = parts[1];
          const optionIndex = parseInt(parts[2], 10);
          
          if (targetUserId === userId) {
            // Get current event info to determine appropriate processing message
            const { getGameState } = await import('@/lib/game/engine');
            const gameState = await getGameState(userId);
            let processingMessage = getProcessingMessage('choice');
            
            if (gameState.currentEvent) {
              const currentEvent = gameState.currentEvent;
              const selectedOption = currentEvent.options[optionIndex];
              
              if (selectedOption) {
                // Get context-aware processing message
                processingMessage = getProcessingMessage('choice', {
                  eventType: currentEvent.eventType,
                  optionText: selectedOption.text,
                });
              }
            }
            
            // Send processing message with context
            await sendProcessingMessage(event.replyToken, processingMessage, 1000);
            response = await handleChoice(userId, `event_${Date.now()}`, optionIndex);
            actionType = 'choice';
          } else {
            response = {
              message: '無效的選擇。',
              quickReply: getQuickReplyButtons(),
            };
          }
        } else {
          response = {
            message: '無效的選擇格式。',
            quickReply: getQuickReplyButtons(),
          };
        }
      } else {
        response = {
          message: '未知的操作，請重新選擇。',
          quickReply: getQuickReplyButtons(),
        };
      }
    } catch (error) {
      console.error('Error handling postback:', error);
      if (error instanceof RateLimitError) {
        response = {
          message: handleLLMError(error),
          quickReply: getQuickReplyButtons(),
        };
      } else {
        response = {
          message: handleLLMError(error),
          quickReply: getQuickReplyButtons(),
        };
      }
    }

    // Send actual response using pushMessage (since replyToken was already used for processing message)
    // Skip if quest_accept already sent messages separately
    if (actionType === 'quest_sent') {
      return; // Messages already sent in quest_accept handler
    }
    
    if (actionType !== 'default') {
      await getClient().pushMessage(userId, {
        type: 'text',
        text: response.message,
        quickReply: response.quickReply,
      });
    } else {
      // For default/unknown actions, use replyToken if not used yet
      await lineClient.replyMessage(event.replyToken, {
        type: 'text',
        text: response.message,
        quickReply: response.quickReply,
      });
    }

    // Save bot response
    await Conversation.create({
      userId,
      messageId: `reply_${Date.now()}_${Math.random()}`,
      timestamp: new Date(),
      messageType: 'text',
      content: response.message,
      response: response.message,
      metadata: { replyToken: event.replyToken, actionType },
    });
  } catch (error) {
    console.error('Unexpected error in handlePostback:', error);
    try {
      // Try to send error message using pushMessage
      await getClient().pushMessage(userId, {
        type: 'text',
        text: '⚠️ 發生錯誤，請稍後再試。',
      });
    } catch (pushError) {
      // If pushMessage fails, try replyMessage as fallback
      try {
        await lineClient.replyMessage(event.replyToken, {
          type: 'text',
          text: '⚠️ 發生錯誤，請稍後再試。',
        });
      } catch (replyError) {
        console.error('Failed to send error message:', replyError);
      }
    }
  }
}

export async function handleWebhookEvent(event: WebhookEvent): Promise<void> {
  try {
    if (event.type === 'message' && event.message.type === 'text') {
      await handleTextMessage(event as MessageEvent);
    } else if (event.type === 'postback') {
      await handlePostback(event as PostbackEvent);
    } else {
      // Ignore other event types (follow, unfollow, etc.)
      console.log(`Ignoring event type: ${event.type}`);
    }
  } catch (error: any) {
    console.error('Error handling webhook event:', error);
    console.error('Event details:', JSON.stringify(event, null, 2));
    
    // Try to send error message if we have a reply token
    if ('replyToken' in event && event.replyToken) {
      try {
        await lineClient.replyMessage(event.replyToken, {
          type: 'text',
          text: '⚠️ 處理訊息時發生錯誤，請稍後再試。',
        });
      } catch (replyError) {
        console.error('Failed to send error reply:', replyError);
      }
    }
    
    // Don't throw error - we want to return 200 to LINE
    // LINE expects 200 even if event processing fails
  }
}

