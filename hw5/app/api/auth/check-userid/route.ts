import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId || userId.trim().length === 0) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate userId format
    const userIdRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!userIdRegex.test(userId)) {
      return NextResponse.json(
        { error: 'User ID must be 3-20 characters and contain only letters, numbers, underscores, or hyphens' },
        { status: 400 }
      );
    }

    // Check if userId is already taken
    const existingUser = await prisma.user.findUnique({
      where: { userId },
      select: { userId: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User ID already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json({ available: true }, { status: 200 });
  } catch (error) {
    console.error('Check userId error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


