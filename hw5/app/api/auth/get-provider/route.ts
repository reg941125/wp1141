import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Find user by userId
    const user = await prisma.user.findUnique({
      where: { userId },
      include: {
        accounts: {
          select: {
            provider: true,
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const provider = user.accounts[0]?.provider;

    if (!provider) {
      return NextResponse.json(
        { error: 'User has no OAuth provider linked' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      userId: user.userId,
      name: user.name,
      provider,
    }, { status: 200 });
  } catch (error) {
    console.error('Get provider error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


