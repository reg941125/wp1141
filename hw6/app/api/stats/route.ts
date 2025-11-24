import { NextRequest, NextResponse } from 'next/server';
import Conversation from '@/lib/db/models/Conversation';
import GameState from '@/lib/db/models/GameState';
import connectDB from '@/lib/db/connection';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await connectDB();

    // Get total conversations
    const totalConversations = await Conversation.countDocuments();

    // Get unique users
    const uniqueUsers = await Conversation.distinct('userId');

    // Get active users (users who sent messages in last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeUsers = await Conversation.distinct('userId', {
      timestamp: { $gte: oneDayAgo },
    });

    // Get game completion stats
    const totalGameStates = await GameState.countDocuments();
    const completedGames = await GameState.countDocuments({
      gameCompleted: true,
    });

    // Get conversations by type
    const conversationsByType = await Conversation.aggregate([
      {
        $group: {
          _id: '$messageType',
          count: { $sum: 1 },
        },
      },
    ]);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentConversations = await Conversation.countDocuments({
      timestamp: { $gte: sevenDaysAgo },
    });

    // Get average HP of active players
    const avgHP = await GameState.aggregate([
      {
        $group: {
          _id: null,
          avgHP: { $avg: '$currentHP' },
          avgGold: { $avg: '$gold' },
        },
      },
    ]);

    return NextResponse.json({
      overview: {
        totalConversations,
        uniqueUsers: uniqueUsers.length,
        activeUsers: activeUsers.length,
        totalGameStates,
        completedGames,
        completionRate: totalGameStates > 0 ? (completedGames / totalGameStates) * 100 : 0,
        recentConversations,
      },
      conversationsByType: conversationsByType.reduce(
        (acc, item) => {
          acc[item._id] = item.count;
          return acc;
        },
        {} as Record<string, number>
      ),
      gameStats: {
        averageHP: avgHP[0]?.avgHP || 0,
        averageGold: avgHP[0]?.avgGold || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

