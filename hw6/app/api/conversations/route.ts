import { NextRequest, NextResponse } from 'next/server';
import Conversation from '@/lib/db/models/Conversation';
import connectDB from '@/lib/db/connection';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (userId) {
      query.userId = userId;
    }

    // Get conversations
    // If userId is specified, sort ascending (oldest first) for chronological order
    // Otherwise, sort descending (newest first) for general list
    const sortOrder = userId ? 1 : -1;
    const conversations = await Conversation.find(query)
      .sort({ timestamp: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await Conversation.countDocuments(query);

    return NextResponse.json({
      conversations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

