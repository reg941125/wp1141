import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query || query.length < 1) {
      return NextResponse.json({ users: [] }, { status: 200 });
    }

    // Search users by userId (case-insensitive partial match)
    const users = await prisma.user.findMany({
      where: {
        userId: {
          contains: query,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        userId: true,
        name: true,
        image: true,
      },
      take: 10, // Limit to 10 results
      orderBy: {
        userId: 'asc',
      },
    });

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('Search users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

