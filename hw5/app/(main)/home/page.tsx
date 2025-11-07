'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
  repostedBy?: string | null;
  repostedByName?: string | null;
  repostedAt?: string | null;
  likes: Array<{ userId: string; createdAt: string }>;
  reposts: Array<{ userId: string; authorUserId: string; createdAt: string }>;
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'following'>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && session && !session.user?.userId) {
      router.push('/auth/setup-userid');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session) {
      fetchPosts();
    }
  }, [session, activeTab]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/posts?feed=${activeTab}`);
      const data = await res.json();

      if (res.ok) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = () => {
    fetchPosts();
  };

  if (status === 'loading' || !session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto">
      <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-4 px-6 text-center font-semibold transition-colors relative ${
              activeTab === 'all'
                ? 'text-black'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All
            {activeTab === 'all' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-1 py-4 px-6 text-center font-semibold transition-colors relative ${
              activeTab === 'following'
                ? 'text-black'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Following
            {activeTab === 'following' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-t-full" />
            )}
          </button>
        </div>
      </div>

      <InlinePost onPostCreated={handlePostCreated} />

      <div className="divide-y divide-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No posts yet. Be the first to post!
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              isRepost={!!post.repostedBy}
              showRepostedBy={post.repostedByName || undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}

