import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> | { postId: string } }
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
    const { postId } = resolvedParams;

    // Check if post exists
    const originalPost = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!originalPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if user already reposted
    const existingRepost = await prisma.repost.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId: postId,
        },
      },
    });

    if (existingRepost) {
      // Undo repost - delete the repost
      await prisma.repost.delete({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId: postId,
          },
        },
      });
    } else {
      // Add repost - create a new repost
      await prisma.repost.create({
        data: {
          userId: session.user.id,
          authorUserId: session.user.userId || '',
          postId: postId,
        },
      });

      // Create notification if user is not reposting their own post
      if (originalPost.authorId !== session.user.id) {
        const fromUser = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { name: true, image: true, userId: true },
        });

        await prisma.notification.create({
          data: {
            type: 'repost',
            fromUserId: session.user.id,
            fromUserName: fromUser?.name || session.user.name || 'Unknown',
            fromUserImage: fromUser?.image || session.user.image || '',
            fromUserUserId: fromUser?.userId || session.user.userId || '',
            toUserId: originalPost.authorId,
            postId: postId,
          },
        });

        // Trigger Pusher event for real-time notification
        await pusherServer.trigger(`user-${originalPost.authorId}`, 'new-notification', {
          type: 'repost',
          fromUser: {
            name: fromUser?.name || session.user.name || 'Unknown',
            userId: fromUser?.userId || session.user.userId || '',
            image: fromUser?.image || session.user.image || '',
          },
        });
      }
    }

    // Get updated reposts count
    const repostsCount = await prisma.repost.count({
      where: { postId: postId },
    });

    // Trigger Pusher event for real-time update
    await pusherServer.trigger(`post-${postId}`, 'update-reposts', {
      repostsCount: repostsCount,
    });

    // Check if user reposted after update
    const finalIsReposted = !existingRepost;

    return NextResponse.json(
      { 
        repostsCount: repostsCount,
        isReposted: finalIsReposted
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Repost error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

