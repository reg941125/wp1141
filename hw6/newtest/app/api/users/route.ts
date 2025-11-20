import { NextRequest, NextResponse } from 'next/server';
import Conversation from '@/lib/db/models/Conversation';
import GameState from '@/lib/db/models/GameState';
import connectDB from '@/lib/db/connection';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const includeStats = searchParams.get('includeStats') === 'true';

    // Get all unique users
    const userIds = await Conversation.distinct('userId');

    if (!includeStats) {
      return NextResponse.json({ users: userIds });
    }

    // Get stats for each user
    const usersWithStats = await Promise.all(
      userIds.map(async (userId) => {
        const conversationCount = await Conversation.countDocuments({ userId });
        const lastConversation = await Conversation.findOne({ userId })
          .sort({ timestamp: -1 })
          .lean();
        
        const gameState = await GameState.findOne({ userId }).lean();

        return {
          userId,
          conversationCount,
          lastActivity: lastConversation?.timestamp || null,
          gameState: gameState
            ? {
                currentHP: gameState.currentHP,
                maxHP: gameState.maxHP,
                gold: gameState.gold,
                items: gameState.items,
                gameCompleted: gameState.gameCompleted,
              }
            : null,
        };
      })
    );

    // Sort by last activity (most recent first)
    usersWithStats.sort((a, b) => {
      if (!a.lastActivity) return 1;
      if (!b.lastActivity) return -1;
      return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
    });

    return NextResponse.json({ users: usersWithStats });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

