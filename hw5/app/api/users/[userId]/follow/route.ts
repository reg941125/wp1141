import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';

export async function POST(
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

    // Find user by userId
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: user.id,
        },
      },
    });

    if (existingFollow) {
      return NextResponse.json(
        { error: 'Already following' },
        { status: 400 }
      );
    }

    // Create follow relationship
    const follow = await prisma.follow.create({
      data: {
        followerId: session.user.id,
        followingId: user.id,
      },
    });

    // Create notification if user is not following themselves
    if (user.id !== session.user.id) {
      const fromUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, image: true, userId: true },
      });

      await prisma.notification.create({
        data: {
          type: 'follow',
          fromUserId: session.user.id,
          fromUserName: fromUser?.name || session.user.name || 'Unknown',
          fromUserImage: fromUser?.image || session.user.image || '',
          fromUserUserId: fromUser?.userId || session.user.userId || '',
          toUserId: user.id,
        },
      });

      // Trigger Pusher event for real-time notification
      await pusherServer.trigger(`user-${user.id}`, 'new-notification', {
        type: 'follow',
        fromUser: {
          name: fromUser?.name || session.user.name || 'Unknown',
          userId: fromUser?.userId || session.user.userId || '',
          image: fromUser?.image || session.user.image || '',
        },
      });
    }

    return NextResponse.json({ follow }, { status: 201 });
  } catch (error) {
    console.error('Follow user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Find user by userId
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete follow relationship
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: user.id,
        },
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Unfollow user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

