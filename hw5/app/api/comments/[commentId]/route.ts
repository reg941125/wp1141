import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET: Fetch a single comment
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

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

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

    return NextResponse.json({ comment: transformedComment }, { status: 200 });
  } catch (error) {
    console.error('Get comment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a comment
export async function DELETE(
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

    // Check if comment exists and belongs to user
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Verify user owns the comment
    if (comment.authorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Delete the comment (cascade will delete related replies)
    await prisma.comment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Delete comment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH: Update a comment
export async function PATCH(
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

    // Check if comment exists and belongs to user
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Verify user owns the comment
    if (comment.authorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Update the comment
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: content.trim(),
      },
    });

    // Transform to match expected format
    const transformedComment = {
      _id: updatedComment.id,
      content: updatedComment.content,
      authorId: updatedComment.authorId,
      authorName: updatedComment.authorName,
      authorImage: updatedComment.authorImage,
      authorUserId: updatedComment.authorUserId,
      postId: updatedComment.postId,
      createdAt: updatedComment.createdAt.toISOString(),
    };

    return NextResponse.json({ comment: transformedComment }, { status: 200 });
  } catch (error) {
    console.error('Update comment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

