'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { HiArrowLeft } from 'react-icons/hi2';
import PostCard from '@/components/PostCard';
import InlinePost from '@/components/InlinePost';

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

export default function CommentDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const commentId = params?.commentId as string;

  const [comment, setComment] = useState<Comment | null>(null);
  const [replies, setReplies] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && session) {
      fetchComment();
      fetchReplies();
    }
  }, [status, session, commentId]);

  const fetchComment = async () => {
    try {
      const res = await fetch(`/api/comments/${commentId}`);
      if (res.ok) {
        const data = await res.json();
        setComment(data.comment);
      }
    } catch (error) {
      console.error('Error fetching comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async () => {
    try {
      const res = await fetch(`/api/comments/${commentId}/replies`);
      if (res.ok) {
        const data = await res.json();
        setReplies(data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
  };

  const handlePostCreated = () => {
    fetchReplies();
  };

  const handleReplyClick = (replyId: string) => {
    router.push(`/comment/${replyId}`);
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
        <div className="text-lg">Loading comment...</div>
      </div>
    );
  }

  if (!comment) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Comment not found</div>
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

      {/* Comment displayed as post */}
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

      {/* Inline Post for replying */}
      <InlinePost 
        onPostCreated={handlePostCreated} 
        parentCommentId={commentId}
        placeholder="回覆留言..."
      />

      {/* Replies */}
      <div className="divide-y divide-gray-200">
        {replies.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No replies yet. Be the first to reply!
          </div>
        ) : (
          replies.map((reply) => (
            <div
              key={reply._id}
              onClick={() => handleReplyClick(reply._id)}
              className="cursor-pointer"
            >
              <PostCard
                post={{
                  _id: reply._id,
                  content: reply.content,
                  authorId: reply.authorId,
                  authorName: reply.authorName,
                  authorImage: reply.authorImage,
                  authorUserId: reply.authorUserId,
                  createdAt: reply.createdAt,
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

