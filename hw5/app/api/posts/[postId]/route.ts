import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

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

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        likes: true,
        reposts: true,
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Transform to match expected format
    const transformedPost = {
      _id: post.id,
      content: post.content,
      authorId: post.authorId,
      authorName: post.authorName,
      authorImage: post.authorImage,
      authorUserId: post.authorUserId,
      image: post.image,
      createdAt: post.createdAt.toISOString(),
      likes: post.likes.map((like) => ({
        userId: like.userId,
        createdAt: like.createdAt.toISOString(),
      })),
      reposts: post.reposts.map((repost) => ({
        userId: repost.userId,
        authorUserId: repost.authorUserId,
        createdAt: repost.createdAt.toISOString(),
      })),
    };

    return NextResponse.json({ post: transformedPost }, { status: 200 });
  } catch (error) {
    console.error('Get post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Check if post exists and belongs to user
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Verify user owns the post
    if (post.authorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Delete the post (cascade will delete related likes, reposts, comments)
    await prisma.post.delete({
      where: { id: postId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH: Update a post
export async function PATCH(
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

    // Check if post exists and belongs to user
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Verify user owns the post
    if (post.authorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Update the post
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        content: content.trim(),
      },
      include: {
        likes: true,
        reposts: true,
      },
    });

    // Transform to match expected format
    const transformedPost = {
      _id: updatedPost.id,
      content: updatedPost.content,
      authorId: updatedPost.authorId,
      authorName: updatedPost.authorName,
      authorImage: updatedPost.authorImage,
      authorUserId: updatedPost.authorUserId,
      image: updatedPost.image,
      createdAt: updatedPost.createdAt.toISOString(),
      likes: updatedPost.likes.map((like) => ({
        userId: like.userId,
        createdAt: like.createdAt.toISOString(),
      })),
      reposts: updatedPost.reposts.map((repost) => ({
        userId: repost.userId,
        authorUserId: repost.authorUserId,
        createdAt: repost.createdAt.toISOString(),
      })),
    };

    return NextResponse.json({ post: transformedPost }, { status: 200 });
  } catch (error) {
    console.error('Update post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

