import Conversation from '@/lib/db/models/Conversation';
import { generateResponse } from '@/lib/gemini/client';
import { getGameState } from '@/lib/game/engine';
import connectDB from '@/lib/db/connection';

const MAX_CONTEXT_MESSAGES = 10;

export async function getConversationContext(
  userId: string,
  limit: number = MAX_CONTEXT_MESSAGES
): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  await connectDB();

  const conversations = await Conversation.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit * 2) // Get more to filter user/assistant pairs
    .lean();

  const context: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  // Process conversations in reverse chronological order
  for (let i = conversations.length - 1; i >= 0 && context.length < limit; i--) {
    const conv = conversations[i];
    
    if (conv.messageType === 'text' && conv.content) {
      // Determine if it's a user message or bot response
      if (conv.response) {
        // This is a bot response
        context.push({
          role: 'assistant',
          content: conv.response,
        });
      } else {
        // This is a user message
        context.push({
          role: 'user',
          content: conv.content,
        });
      }
    }
  }

  return context;
}

export async function generateContextualResponse(
  userId: string,
  userMessage: string
): Promise<string> {
  const context = await getConversationContext(userId);
  const gameState = await getGameState(userId);

  // Add current user message to context
  const fullContext = [
    ...context,
    {
      role: 'user' as const,
      content: userMessage,
    },
  ];

  return generateResponse(fullContext, gameState);
}

export async function saveConversation(
  userId: string,
  userMessage: string,
  botResponse: string,
  messageId: string,
  messageType: 'text' | 'postback' = 'text'
): Promise<void> {
  await connectDB();

  // Save user message
  await Conversation.create({
    userId,
    messageId: `user_${messageId}`,
    timestamp: new Date(),
    messageType,
    content: userMessage,
  });

  // Save bot response
  await Conversation.create({
    userId,
    messageId: `bot_${Date.now()}_${Math.random()}`,
    timestamp: new Date(),
    messageType: 'text',
    content: botResponse,
    response: botResponse,
  });
}

