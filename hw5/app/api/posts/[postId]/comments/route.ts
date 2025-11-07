import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';
import { extractMentions } from '@/lib/utils/mentions';

// GET: Fetch comments for a post
export async function GET(
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

    const comments = await prisma.comment.findMany({
      where: { 
        postId,
        parentCommentId: null, // Only get top-level comments
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Transform to match expected format
    const transformedComments = comments.map((comment) => ({
      _id: comment.id,
      content: comment.content,
      authorId: comment.authorId,
      authorName: comment.authorName,
      authorImage: comment.authorImage,
      authorUserId: comment.authorUserId,
      postId: comment.postId,
      createdAt: comment.createdAt.toISOString(),
    }));

    return NextResponse.json({ comments: transformedComments }, { status: 200 });
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new comment
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

    // Check if the post exists
    const postExists = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!postExists) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    if (content.length > 280) {
      return NextResponse.json(
        { error: 'Content exceeds 280 characters' },
        { status: 400 }
      );
    }

    // Get latest user info from database to ensure we have the latest image
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, image: true, userId: true },
    });

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        postId,
        authorId: session.user.id,
        authorName: dbUser?.name || session.user.name || 'Unknown',
        authorImage: dbUser?.image || session.user.image || '',
        authorUserId: dbUser?.userId || session.user.userId || '',
      },
    });

    // Transform to match expected format
    const transformedComment = {
      _id: comment.id,
      content: comment.content,
      authorId: comment.authorId,
      authorName: comment.authorName,
      authorImage: comment.authorImage,
      authorUserId: comment.authorUserId,
      postId: comment.postId,
      createdAt: comment.createdAt.toISOString(),
    };

    // Create notification if user is not commenting on their own post
    if (postExists.authorId !== session.user.id) {
      await prisma.notification.create({
        data: {
          type: 'comment',
          fromUserId: session.user.id,
          fromUserName: dbUser?.name || session.user.name || 'Unknown',
          fromUserImage: dbUser?.image || session.user.image || '',
          fromUserUserId: dbUser?.userId || session.user.userId || '',
          toUserId: postExists.authorId,
          postId: postId,
          commentId: comment.id,
        },
      });

      // Trigger Pusher event for real-time notification
      await pusherServer.trigger(`user-${postExists.authorId}`, 'new-notification', {
        type: 'comment',
        fromUser: {
          name: dbUser?.name || session.user.name || 'Unknown',
          userId: dbUser?.userId || session.user.userId || '',
          image: dbUser?.image || session.user.image || '',
        },
      });
    }

    // Extract mentions and create notifications
    const mentionedUserIds = extractMentions(content);
    if (mentionedUserIds.length > 0) {
      // Find all mentioned users
      const mentionedUsers = await prisma.user.findMany({
        where: {
          userId: { in: mentionedUserIds },
        },
        select: { id: true, userId: true },
      });

      // Create notifications for each mentioned user (excluding the author and post author)
      for (const mentionedUser of mentionedUsers) {
        if (mentionedUser.id !== session.user.id && mentionedUser.id !== postExists.authorId) {
          await prisma.notification.create({
            data: {
              type: 'mention',
              fromUserId: session.user.id,
              fromUserName: dbUser?.name || session.user.name || 'Unknown',
              fromUserImage: dbUser?.image || session.user.image || '',
              fromUserUserId: dbUser?.userId || session.user.userId || '',
              toUserId: mentionedUser.id,
              postId: postId,
              commentId: comment.id,
            },
          });

          // Trigger Pusher event for real-time notification
          await pusherServer.trigger(`user-${mentionedUser.id}`, 'new-notification', {
            type: 'mention',
            fromUser: {
              name: dbUser?.name || session.user.name || 'Unknown',
              userId: dbUser?.userId || session.user.userId || '',
              image: dbUser?.image || session.user.image || '',
            },
          });
        }
      }
    }

    // Trigger Pusher event for real-time update
    await pusherServer.trigger(`post-${postId}`, 'new-comment', {
      comment: transformedComment,
    });

    return NextResponse.json({ comment: transformedComment }, { status: 201 });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

