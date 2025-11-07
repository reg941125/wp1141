'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { HiArrowLeft } from 'react-icons/hi2';
import PostCard from '@/components/PostCard';
import InlinePost from '@/components/InlinePost';

interface Post {
  _id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorImage: string;
  authorUserId: string;
  image?: string;
  createdAt: string;
  likes: Array<{ userId: string; createdAt: string }>;
  reposts: Array<{ userId: string; authorUserId: string; createdAt: string }>;
}

interface Comment {
  _id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorImage: string;
  authorUserId: string;
  createdAt: string;
  postId: string;
}

export default function PostDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const postId = params?.postId as string;

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && session) {
      fetchPost();
      fetchComments();
    }
  }, [status, session, postId]);

  const fetchPost = async () => {
    try {
      const res = await fetch(`/api/posts/${postId}`);
      if (res.ok) {
        const data = await res.json();
        setPost(data.post);
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handlePostCreated = () => {
    fetchComments();
  };

  const handleCommentClick = (commentId: string) => {
    router.push(`/comment/${commentId}`);
  };

  if (status === 'loading' || !session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading post...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Post not found</div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto">
      {/* Header with back button */}
      <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
        <div className="flex items-center space-x-4 px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <HiArrowLeft className="text-2xl" />
          </button>
          <h1 className="text-xl font-bold">Post</h1>
        </div>
      </div>

      {/* Post */}
      <PostCard post={post} hideComments={true} />

      {/* Inline Post for commenting */}
      <InlinePost 
        onPostCreated={handlePostCreated} 
        postId={postId}
        placeholder="留下你的留言..."
      />

      {/* Comments */}
      <div className="divide-y divide-gray-200">
        {comments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment._id}
              onClick={() => handleCommentClick(comment._id)}
              className="cursor-pointer"
            >
              <PostCard
                post={{
                  _id: comment._id,
                  content: comment.content,
                  authorId: comment.authorId,
                  authorName: comment.authorName,
                  authorImage: comment.authorImage,
                  authorUserId: comment.authorUserId,
                  createdAt: comment.createdAt,
                  likes: [],
                  reposts: [],
                }}
                hideComments={true}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

