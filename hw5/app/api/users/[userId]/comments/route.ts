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

    // Find user by userId to get their authorId
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

    // Get all comments by this user with post information
    const comments = await prisma.comment.findMany({
      where: { authorId: user.id },
      include: {
        post: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
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
      post: comment.post
        ? {
            _id: comment.post.id,
            content: comment.post.content,
            authorId: comment.post.authorId,
            authorName: comment.post.authorName,
            authorImage: comment.post.authorImage,
            authorUserId: comment.post.authorUserId,
            createdAt: comment.post.createdAt.toISOString(),
          }
        : null,
    }));

    return NextResponse.json({ comments: transformedComments }, { status: 200 });
  } catch (error) {
    console.error('Get user comments error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    // Provide more specific error message for database connection issues
    if (errorMessage.includes('Can\'t reach database server')) {
      return NextResponse.json(
        { 
          error: '資料庫連接失敗',
          details: '無法連接到 PostgreSQL 數據庫服務器。請確認數據庫服務是否正在運行。'
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

