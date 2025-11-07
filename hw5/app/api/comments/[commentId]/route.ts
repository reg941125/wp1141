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

