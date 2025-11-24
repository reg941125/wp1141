import { NextRequest, NextResponse } from 'next/server';
import { getClient } from '@/lib/line/client';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, message } = body;

    if (!userId || !message) {
      return NextResponse.json(
        { error: 'userId and message are required' },
        { status: 400 }
      );
    }

    const client = getClient();

    // Send push message to user
    await client.pushMessage(userId, {
      type: 'text',
      text: message,
    });

    return NextResponse.json({ success: true, message: 'Message sent successfully' });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send message',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

