'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { HiArrowLeft, HiChatBubbleLeft } from 'react-icons/hi2';
import FollowButton from '@/components/FollowButton';
import EditProfileDialog from '@/components/EditProfileDialog';
import PostCard from '@/components/PostCard';
import TextWithMentions from '@/components/TextWithMentions';

interface User {
  id: string;
  email: string;
  name: string;
  userId: string;
  image: string;
  bio: string;
  coverImage: string;
  createdAt: string;
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
}

interface Comment {
  _id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorImage: string;
  authorUserId: string;
  postId: string;
  createdAt: string;
  post?: {
    _id: string;
    content: string;
    authorId: string;
    authorName: string;
    authorImage: string;
    authorUserId: string;
    createdAt: string;
  } | null;
}

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

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reposts, setReposts] = useState<Post[]>([]);
  const [likes, setLikes] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'reposts' | 'likes' | 'comments'>('posts');
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const isOwnProfile = session?.user?.userId === userId;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchUserData();
    }
  }, [session, userId]);

  useEffect(() => {
    if (session && user) {
      fetchPosts();
    }
  }, [session, user, activeTab]);

  const fetchUserData = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const userRes = await fetch(`/api/users/${userId}`);
      const userData = await userRes.json();

      if (userRes.ok) {
        setUser(userData.user);
      } else {
        console.error('Failed to fetch user:', userData.error);
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    if (!userId) return;
    
    try {
      if (activeTab === 'posts') {
        const postsRes = await fetch(`/api/users/${userId}/posts?type=posts`);
        const postsData = await postsRes.json();
        if (postsRes.ok) {
          setPosts(postsData.posts || []);
        } else {
          console.error('Failed to fetch posts:', postsData.error);
          setPosts([]);
        }
      } else if (activeTab === 'reposts') {
        const repostsRes = await fetch(`/api/users/${userId}/posts?type=reposts`);
        const repostsData = await repostsRes.json();
        if (repostsRes.ok) {
          setReposts(repostsData.posts || []);
        } else {
          console.error('Failed to fetch reposts:', repostsData.error);
          setReposts([]);
        }
      } else if (activeTab === 'likes') {
        const likesRes = await fetch(`/api/users/${userId}/posts?type=likes`);
        const likesData = await likesRes.json();
        if (likesRes.ok) {
          setLikes(likesData.posts || []);
        } else {
          console.error('Failed to fetch likes:', likesData.error);
          setLikes([]);
        }
      } else if (activeTab === 'comments') {
        const commentsRes = await fetch(`/api/users/${userId}/comments`);
        const commentsData = await commentsRes.json();
        if (commentsRes.ok) {
          setComments(commentsData.comments || []);
        } else {
          console.error('Failed to fetch comments:', commentsData.error);
          setComments([]);
        }
      }
    } catch (error) {
      console.error('Error fetching posts/reposts/likes/comments:', error);
      if (activeTab === 'posts') {
        setPosts([]);
      } else if (activeTab === 'reposts') {
        setReposts([]);
      } else if (activeTab === 'likes') {
        setLikes([]);
      } else {
        setComments([]);
      }
    }
  };

  const handleEditSuccess = () => {
    fetchUserData();
    setShowEditDialog(false);
  };

  if (status === 'loading' || !session || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-red-600">User not found</div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
        <div className="flex items-center space-x-4 px-4 py-3">
          <button
            onClick={() => router.push('/home')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <HiArrowLeft className="text-2xl" />
          </button>
          <div>
            <h1 className="text-xl font-bold">{user.name}</h1>
            <p className="text-sm text-gray-500">
              {activeTab === 'posts' 
                ? `${posts.length} ${posts.length === 1 ? 'Post' : 'Posts'}`
                : activeTab === 'reposts'
                ? `${reposts.length} ${reposts.length === 1 ? 'Repost' : 'Reposts'}`
                : activeTab === 'likes'
                ? `${likes.length} ${likes.length === 1 ? 'Like' : 'Likes'}`
                : `${comments.length} ${comments.length === 1 ? 'Comment' : 'Comments'}`}
            </p>
          </div>
        </div>
      </div>

      {/* Cover Image */}
      <div className="relative h-64 bg-gray-200">
        {user.coverImage && (
          <Image
            src={user.coverImage}
            alt="Cover"
            fill
            className="object-cover"
          />
        )}
      </div>

      {/* Profile Header */}
      <div className="relative px-4 pb-4 border-b border-gray-200">
        <div className="flex justify-between items-start -mt-20">
          {/* Avatar */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-white p-1">
              {user.image && (
                <Image
                  src={user.image}
                  alt={user.name}
                  width={128}
                  height={128}
                  className="rounded-full"
                />
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-24">
            {isOwnProfile ? (
              <button
                onClick={() => setShowEditDialog(true)}
                className="px-4 py-2 border border-gray-300 rounded-full font-semibold hover:bg-gray-100"
              >
                Edit Profile
              </button>
            ) : (
              <FollowButton
                userId={user.userId}
                isFollowing={user.isFollowing || false}
                onToggle={fetchUserData}
              />
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="mt-4">
          <h2 className="text-2xl font-bold">{user.name}</h2>
          <p className="text-gray-500">@{user.userId}</p>
          <p className="mt-2">{user.bio || 'No bio yet.'}</p>

          {/* Follow Stats */}
          <div className="flex space-x-4 mt-4">
            <button className="hover:underline">
              <span className="font-semibold">{user.followingCount || 0}</span>
              <span className="text-gray-500 ml-1">Following</span>
            </button>
            <button className="hover:underline">
              <span className="font-semibold">{user.followersCount || 0}</span>
              <span className="text-gray-500 ml-1">Followers</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mt-4">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-4 text-center font-semibold transition-colors relative ${
              activeTab === 'posts'
                ? 'text-black'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Posts
            {activeTab === 'posts' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('reposts')}
            className={`flex-1 py-4 text-center font-semibold transition-colors relative ${
              activeTab === 'reposts'
                ? 'text-black'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Reposts
            {activeTab === 'reposts' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex-1 py-4 text-center font-semibold transition-colors relative ${
              activeTab === 'comments'
                ? 'text-black'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Comments
            {activeTab === 'comments' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-t-full" />
            )}
          </button>
          {isOwnProfile && (
            <button
              onClick={() => setActiveTab('likes')}
              className={`flex-1 py-4 text-center font-semibold transition-colors relative ${
                activeTab === 'likes'
                  ? 'text-black'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Likes
              {activeTab === 'likes' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-t-full" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Posts / Reposts / Likes */}
      <div className="divide-y divide-gray-200">
        {activeTab === 'posts' && (
          <>
            {posts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No posts yet.
              </div>
            ) : (
              posts.map((post: Post) => (
                <PostCard key={post._id} post={post} />
              ))
            )}
          </>
        )}

        {activeTab === 'reposts' && (
          <>
            {reposts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No reposts yet.
              </div>
            ) : (
              reposts.map((post: Post) => (
                <PostCard 
                  key={post._id} 
                  post={post} 
                  showRepostedBy={user?.name || 'User'} 
                />
              ))
            )}
          </>
        )}

        {activeTab === 'likes' && (
          <>
            {likes.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No likes yet.
              </div>
            ) : (
              likes.map((post: Post) => (
                <PostCard 
                  key={post._id} 
                  post={post} 
                  showLikedBy={user?.name || 'User'} 
                />
              ))
            )}
          </>
        )}

        {activeTab === 'comments' && (
          <>
            {comments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No comments yet.
              </div>
            ) : (
              comments.map((comment: Comment) => (
                <div key={comment._id} className="p-4 hover:bg-gray-50 border-b border-gray-200">
                  <div className="mb-2 text-sm text-gray-500 flex items-center space-x-1">
                    <HiChatBubbleLeft className="w-4 h-4 text-blue-500" />
                    <span>{user?.name || 'User'} commented</span>
                  </div>
                  {/* Original Post */}
                  {comment.post && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start space-x-2">
                        {comment.post.authorImage && (
                          <Image
                            src={comment.post.authorImage}
                            alt={comment.post.authorName}
                            width={32}
                            height={32}
                            className="rounded-full cursor-pointer"
                            onClick={() => router.push(`/profile/${comment.post?.authorUserId}`)}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span 
                              className="font-semibold text-sm hover:underline cursor-pointer"
                              onClick={() => router.push(`/profile/${comment.post?.authorUserId}`)}
                            >
                              {comment.post.authorName}
                            </span>
                            <span className="text-gray-500 text-sm">@{comment.post.authorUserId}</span>
                          </div>
                          <p className="mt-1 text-sm break-words">
                            <TextWithMentions text={comment.post.content} />
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Comment Content */}
                  <div className="flex items-start space-x-3">
                    {comment.authorImage && (
                      <Image
                        src={comment.authorImage}
                        alt={comment.authorName}
                        width={48}
                        height={48}
                        className="rounded-full cursor-pointer"
                        onClick={() => router.push(`/profile/${comment.authorUserId}`)}
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span 
                          className="font-semibold hover:underline cursor-pointer"
                          onClick={() => router.push(`/profile/${comment.authorUserId}`)}
                        >
                          {comment.authorName}
                        </span>
                        <span className="text-gray-500">@{comment.authorUserId}</span>
                      </div>
                      <p className="mt-1">
                        <TextWithMentions text={comment.content} />
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {showEditDialog && (
        <EditProfileDialog
          user={user}
          onClose={() => setShowEditDialog(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}

