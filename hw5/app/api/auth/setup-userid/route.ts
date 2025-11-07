import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId || userId.trim().length === 0) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate userId format (alphanumeric, underscore, hyphen, 3-20 chars)
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
    });

    if (existingUser && existingUser.id !== session.user.id) {
      return NextResponse.json(
        { error: 'User ID already exists' },
        { status: 400 }
      );
    }

    // Get current user from database
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user with userId
    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: { userId },
      select: {
        id: true,
        email: true,
        name: true,
        userId: true,
        image: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error('Setup userId error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

