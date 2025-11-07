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
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if user already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId: postId,
        },
      },
    });

    if (existingLike) {
      // Unlike - delete the like
      await prisma.like.delete({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId: postId,
          },
        },
      });
    } else {
      // Like - create a new like
      await prisma.like.create({
        data: {
          userId: session.user.id,
          postId: postId,
        },
      });

      // Create notification if user is not liking their own post
      if (post.authorId !== session.user.id) {
        const fromUser = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { name: true, image: true, userId: true },
        });

        await prisma.notification.create({
          data: {
            type: 'like',
            fromUserId: session.user.id,
            fromUserName: fromUser?.name || session.user.name || 'Unknown',
            fromUserImage: fromUser?.image || session.user.image || '',
            fromUserUserId: fromUser?.userId || session.user.userId || '',
            toUserId: post.authorId,
            postId: postId,
          },
        });

        // Trigger Pusher event for real-time notification
        await pusherServer.trigger(`user-${post.authorId}`, 'new-notification', {
          type: 'like',
          fromUser: {
            name: fromUser?.name || session.user.name || 'Unknown',
            userId: fromUser?.userId || session.user.userId || '',
            image: fromUser?.image || session.user.image || '',
          },
        });
      }
    }

    // Get updated likes count
    const likesCount = await prisma.like.count({
      where: { postId: postId },
    });

    // Trigger Pusher event for real-time update
    await pusherServer.trigger(`post-${postId}`, 'update-likes', {
      likesCount: likesCount,
    });

    // Check if user liked after update
    const isLiked = existingLike === null ? false : true;
    // After toggle, if we deleted, isLiked is false; if we created, isLiked is true
    const finalIsLiked = !existingLike;

    return NextResponse.json(
      { 
        likesCount: likesCount,
        isLiked: finalIsLiked
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Like post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

