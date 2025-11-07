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

    // Get query parameter to filter posts, reposts, or likes
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'posts'; // 'posts', 'reposts', or 'likes'

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

    let posts;

    if (type === 'reposts') {
      // Get only posts that this user has reposted
      const reposts = await prisma.repost.findMany({
        where: { userId: user.id },
        include: {
          post: {
            include: {
              likes: true,
              reposts: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      posts = reposts.map((repost) => ({
        ...repost.post,
        repostedAt: repost.createdAt.toISOString(),
        repostedBy: repost.authorUserId,
      }));
    } else if (type === 'likes') {
      // Get only posts that this user has liked
      const likes = await prisma.like.findMany({
        where: { userId: user.id },
        include: {
          post: {
            include: {
              likes: true,
              reposts: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      posts = likes.map((like) => ({
        ...like.post,
        likedAt: like.createdAt.toISOString(),
      }));
    } else {
      // Get only posts created by this user (exclude reposts)
      posts = await prisma.post.findMany({
        where: { authorId: user.id },
        include: {
          likes: true,
          reposts: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    }

    // Transform to match expected format
    const transformedPosts = posts.map((post: any) => ({
      _id: post.id,
      content: post.content,
      authorId: post.authorId,
      authorName: post.authorName,
      authorImage: post.authorImage,
      authorUserId: post.authorUserId,
      image: post.image,
      createdAt: post.createdAt.toISOString(),
      likes: post.likes.map((like: any) => ({
        userId: like.userId,
        createdAt: like.createdAt.toISOString(),
      })),
      reposts: post.reposts.map((repost: any) => ({
        userId: repost.userId,
        authorUserId: repost.authorUserId,
        createdAt: repost.createdAt.toISOString(),
      })),
      repostedAt: post.repostedAt,
      repostedBy: post.repostedBy,
      likedAt: post.likedAt,
    }));

    return NextResponse.json({ posts: transformedPosts }, { status: 200 });
  } catch (error) {
    console.error('Get user posts error:', error);
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

