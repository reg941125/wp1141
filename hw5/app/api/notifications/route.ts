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

    const notifications = await prisma.notification.findMany({
      where: { toUserId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Transform to match expected format
    const transformedNotifications = notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      fromUserId: notification.fromUserId,
      fromUserName: notification.fromUserName,
      fromUserImage: notification.fromUserImage,
      fromUserUserId: notification.fromUserUserId,
      toUserId: notification.toUserId,
      postId: notification.postId,
      commentId: notification.commentId,
      read: notification.read,
      createdAt: notification.createdAt.toISOString(),
    }));

    return NextResponse.json({ notifications: transformedNotifications }, { status: 200 });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notificationIds, read } = body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    // Mark notifications as read
    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        toUserId: session.user.id, // Ensure user can only update their own notifications
      },
      data: { read: read !== undefined ? read : true },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Update notifications error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


