import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get all registered users with their userID and name
    // Filter users who have userId and at least one OAuth account
    const allUsers = await prisma.user.findMany({
      where: {
        accounts: {
          some: {}, // Has at least one OAuth account
        },
      },
      select: {
        id: true,
        userId: true,
        name: true,
        image: true,
        accounts: {
          select: {
            provider: true,
          },
          take: 1, // Get the first provider
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter out users without userId
    const users = allUsers.filter((user) => user.userId !== null);

    // Format users with provider info
    const formattedUsers = users.map((user) => ({
      id: user.id,
      userId: user.userId,
      name: user.name || 'Unknown',
      image: user.image,
      provider: user.accounts[0]?.provider || 'unknown',
    }));

    return NextResponse.json({ users: formattedUsers }, { status: 200 });
  } catch (error) {
    console.error('Get users list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

