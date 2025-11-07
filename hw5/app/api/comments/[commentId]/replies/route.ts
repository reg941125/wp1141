import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';
import { extractMentions } from '@/lib/utils/mentions';

// GET: Fetch replies to a comment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> | { commentId: string } }
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
    const { commentId } = resolvedParams;

    const comments = await prisma.comment.findMany({
      where: { parentCommentId: commentId },
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
    console.error('Get comment replies error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a reply to a comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> | { commentId: string } }
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
    const { commentId } = resolvedParams;

    // Check if the parent comment exists
    const parentComment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!parentComment) {
      return NextResponse.json(
        { error: 'Comment not found' },
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

    // Get latest user info from database
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, image: true, userId: true },
    });

    // Create reply comment
    const reply = await prisma.comment.create({
      data: {
        content: content.trim(),
        postId: parentComment.postId,
        parentCommentId: commentId,
        authorId: session.user.id,
        authorName: dbUser?.name || session.user.name || 'Unknown',
        authorImage: dbUser?.image || session.user.image || '',
        authorUserId: dbUser?.userId || session.user.userId || '',
      },
    });

    // Transform to match expected format
    const transformedReply = {
      _id: reply.id,
      content: reply.content,
      authorId: reply.authorId,
      authorName: reply.authorName,
      authorImage: reply.authorImage,
      authorUserId: reply.authorUserId,
      postId: reply.postId,
      createdAt: reply.createdAt.toISOString(),
    };

    // Create notification if user is not replying to their own comment
    if (parentComment.authorId !== session.user.id) {
      await prisma.notification.create({
        data: {
          type: 'comment',
          fromUserId: session.user.id,
          fromUserName: dbUser?.name || session.user.name || 'Unknown',
          fromUserImage: dbUser?.image || session.user.image || '',
          fromUserUserId: dbUser?.userId || session.user.userId || '',
          toUserId: parentComment.authorId,
          postId: parentComment.postId,
          commentId: reply.id,
        },
      });

      await pusherServer.trigger(`user-${parentComment.authorId}`, 'new-notification', {
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
      const mentionedUsers = await prisma.user.findMany({
        where: { userId: { in: mentionedUserIds } },
        select: { id: true, userId: true },
      });

      for (const mentionedUser of mentionedUsers) {
        if (mentionedUser.id !== session.user.id && mentionedUser.id !== parentComment.authorId) {
          await prisma.notification.create({
            data: {
              type: 'mention',
              fromUserId: session.user.id,
              fromUserName: dbUser?.name || session.user.name || 'Unknown',
              fromUserImage: dbUser?.image || session.user.image || '',
              fromUserUserId: dbUser?.userId || session.user.userId || '',
              toUserId: mentionedUser.id,
              postId: parentComment.postId,
              commentId: reply.id,
            },
          });

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

    return NextResponse.json({ comment: transformedReply }, { status: 201 });
  } catch (error) {
    console.error('Create reply error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

