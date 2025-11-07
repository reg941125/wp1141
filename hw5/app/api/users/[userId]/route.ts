import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> | { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Handle both Promise and direct params (for Next.js 15 compatibility)
    const resolvedParams = await Promise.resolve(params);
    const { userId } = resolvedParams;

    // Find user by userId (username)
    const user = await prisma.user.findUnique({
      where: { userId },
      select: {
        id: true,
        email: true,
        name: true,
        userId: true,
        image: true,
        bio: true,
        coverImage: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get follow counts
    const [followersCount, followingCount] = await Promise.all([
      prisma.follow.count({ where: { followingId: user.id } }),
      prisma.follow.count({ where: { followerId: user.id } }),
    ]);

    // Check if current user is following this user
    const isFollowing = session.user.id !== user.id ? (
      await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: user.id,
          },
        },
      })
    ) : false;

    return NextResponse.json({
      user: {
        ...user,
        followersCount,
        followingCount,
        isFollowing: !!isFollowing,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Get user error:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Can\'t reach database server')) {
        return NextResponse.json(
          { 
            error: '資料庫連接失敗',
            details: '無法連接到 PostgreSQL 數據庫服務器。請確認數據庫服務是否正在運行。'
          },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> | { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Handle both Promise and direct params (for Next.js 15 compatibility)
    const resolvedParams = await Promise.resolve(params);
    const { userId } = resolvedParams;

    // Verify user can only edit their own profile
    if (session.user.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, bio } = body;

    const user = await prisma.user.update({
      where: { userId },
      data: {
        name,
        bio,
        // Do not update image or coverImage - they come from OAuth
      },
      select: {
        id: true,
        email: true,
        name: true,
        userId: true,
        image: true,
        bio: true,
        coverImage: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

