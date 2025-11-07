import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';
import { extractMentions } from '@/lib/utils/mentions';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content, image } = body;

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

    const post = await prisma.post.create({
      data: {
        content: content.trim(),
        authorId: session.user.id,
        authorName: dbUser?.name || session.user.name || 'Unknown',
        authorImage: dbUser?.image || session.user.image || '',
        authorUserId: dbUser?.userId || session.user.userId || '',
        image: image || undefined,
      },
      include: {
        likes: true,
        reposts: true,
      },
    });

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

      // Create notifications for each mentioned user (excluding the author)
      for (const mentionedUser of mentionedUsers) {
        if (mentionedUser.id !== session.user.id) {
          await prisma.notification.create({
            data: {
              type: 'mention',
              fromUserId: session.user.id,
              fromUserName: dbUser?.name || session.user.name || 'Unknown',
              fromUserImage: dbUser?.image || session.user.image || '',
              fromUserUserId: dbUser?.userId || session.user.userId || '',
              toUserId: mentionedUser.id,
              postId: post.id,
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

    return NextResponse.json({ post: transformedPost }, { status: 201 });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const feed = searchParams.get('feed') || 'all';

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let posts;

    if (feed === 'following') {
      // Get posts from users the current user follows, including reposts
      const followings = await prisma.follow.findMany({
        where: { followerId: session.user.id },
        select: { followingId: true },
      });

      const followingIds = followings.map((f) => f.followingId);
      
      // Get posts created by following users
      const postsByFollowing = await prisma.post.findMany({
        where: {
          authorId: { in: followingIds },
        },
        include: {
          likes: true,
          reposts: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      // Get reposts by following users
      const repostsByFollowing = await prisma.repost.findMany({
        where: {
          userId: { in: followingIds },
        },
        include: {
          post: {
            include: {
              likes: true,
              reposts: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              userId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      // Combine and sort by repost/post creation time
      const repostedPosts = repostsByFollowing.map((repost) => ({
        ...repost.post,
        repostedBy: repost.userId,
        repostedByName: repost.user.name || 'User',
        repostedAt: repost.createdAt,
      }));

      // Merge posts and reposts, sort by most recent
      const allItems = [
        ...postsByFollowing.map((p) => ({ ...p, repostedBy: null, repostedByName: null, repostedAt: p.createdAt })),
        ...repostedPosts,
      ].sort((a, b) => {
        const timeA = a.repostedAt || a.createdAt;
        const timeB = b.repostedAt || b.createdAt;
        return timeB.getTime() - timeA.getTime();
      });

      posts = allItems.slice(0, 50) as any[];
    } else {
      // Get all posts
      posts = await prisma.post.findMany({
        include: {
          likes: true,
          reposts: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
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
      repostedBy: post.repostedBy || null,
      repostedByName: post.repostedByName || null,
      repostedAt: post.repostedAt ? post.repostedAt.toISOString() : null,
      likes: post.likes.map((like: any) => ({
        userId: like.userId,
        createdAt: like.createdAt.toISOString(),
      })),
      reposts: post.reposts.map((repost: any) => ({
        userId: repost.userId,
        authorUserId: repost.authorUserId,
        createdAt: repost.createdAt.toISOString(),
      })),
    }));

    return NextResponse.json({ posts: transformedPosts }, { status: 200 });
  } catch (error) {
    console.error('Get posts error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

