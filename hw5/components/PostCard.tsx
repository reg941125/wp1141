'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import { HiHeart, HiArrowPathRoundedSquare, HiChatBubbleLeft, HiEllipsisHorizontal, HiPencil, HiTrash } from 'react-icons/hi2';
import { calculateCharacterCount } from '@/lib/utils/characterCount';
import TextWithMentions from './TextWithMentions';
import MentionAutocomplete from './MentionAutocomplete';

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

interface PostCardProps {
  post: Post;
  showRepostedBy?: string; // User name who reposted
  showLikedBy?: string; // User name who liked
  isRepost?: boolean; // Whether this is a repost (cannot be deleted)
  onPostClick?: () => void; // Callback when post is clicked
  hideComments?: boolean; // Hide comments section
}

export default function PostCard({ post, showRepostedBy, showLikedBy, isRepost = false, onPostClick, hideComments = false }: PostCardProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
  });

  const [likesCount, setLikesCount] = useState(post.likes.length);
  const [isLiked, setIsLiked] = useState(false);
  const [repostsCount, setRepostsCount] = useState(post.reposts.length);
  const [isReposted, setIsReposted] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [editCommentContent, setEditCommentContent] = useState<{ [key: string]: string }>({});
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [isEditingComment, setIsEditingComment] = useState<{ [key: string]: boolean }>({});
  const [isDeletingComment, setIsDeletingComment] = useState<{ [key: string]: boolean }>({});
  const [showCommentMenu, setShowCommentMenu] = useState<{ [key: string]: boolean }>({});
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const deleteMenuRef = useRef<HTMLDivElement>(null);
  const editPostTextareaRef = useRef<HTMLTextAreaElement>(null);
  const editCommentTextareaRefs = useRef<{ [key: string]: React.RefObject<HTMLTextAreaElement | null> }>({});
  const commentMenuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Initialize refs for comments
  useEffect(() => {
    comments.forEach(comment => {
      if (!editCommentTextareaRefs.current[comment._id]) {
        editCommentTextareaRefs.current[comment._id] = { current: null };
      }
    });
  }, [comments]);

  // Check if current user has liked this post
  useEffect(() => {
    if (session?.user?.id) {
      const userLiked = post.likes.some(
        (like) => like.userId === session.user.id
      );
      setIsLiked(userLiked);
    }
  }, [post.likes, session?.user?.id]);

  // Check if current user has reposted this post
  useEffect(() => {
    if (session?.user?.id) {
      const userReposted = post.reposts.some(
        (repost) => repost.userId === session.user.id
      );
      setIsReposted(userReposted);
    }
  }, [post.reposts, session?.user?.id]);

  // Fetch comments on component mount (only if not hiding comments)
  useEffect(() => {
    if (hideComments) return;
    
    const fetchComments = async () => {
      try {
        setCommentsLoading(true);
        const res = await fetch(`/api/posts/${post._id}/comments`);
        if (res.ok) {
          const data = await res.json();
          setComments(data.comments || []);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setCommentsLoading(false);
      }
    };

    fetchComments();
  }, [post._id, hideComments]);

  // Close delete menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (deleteMenuRef.current && !deleteMenuRef.current.contains(event.target as Node)) {
        setShowDeleteMenu(false);
      }
      // Close comment menus when clicking outside
      Object.keys(commentMenuRefs.current).forEach(commentId => {
        if (commentMenuRefs.current[commentId] && !commentMenuRefs.current[commentId]?.contains(event.target as Node)) {
          setShowCommentMenu(prev => ({ ...prev, [commentId]: false }));
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLike = async () => {
    try {
      const res = await fetch(`/api/posts/${post._id}/like`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        setLikesCount(data.likesCount);
        setIsLiked(data.isLiked);
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleRepost = async () => {
    try {
      const res = await fetch(`/api/posts/${post._id}/repost`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        setRepostsCount(data.repostsCount);
        setIsReposted(data.isReposted);
      }
    } catch (error) {
      console.error('Error reposting:', error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/posts/${post._id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: commentContent }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments([data.comment, ...comments]);
        setCommentContent('');
        setShowCommentInput(false);
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('確定要刪除這篇貼文嗎？')) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/posts/${post._id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteMenu(false);
    }
  };

  const handleEditPost = () => {
    setEditPostContent(post.content);
    setEditingPostId(post._id);
    setIsEditingPost(true);
    setShowDeleteMenu(false);
    setTimeout(() => {
      editPostTextareaRef.current?.focus();
    }, 0);
  };

  const handleSavePostEdit = async () => {
    const newCount = calculateCharacterCount(editPostContent);
    if (!editPostContent.trim() || editPostContent === post.content || newCount > 280) {
      setIsEditingPost(false);
      return;
    }

    setIsEditingPost(false);
    try {
      const res = await fetch(`/api/posts/${post._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: editPostContent }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update post content locally
        post.content = data.post.content;
        window.location.reload();
      }
    } catch (error) {
      console.error('Error editing post:', error);
    }
  };

  const handleCancelPostEdit = () => {
    setIsEditingPost(false);
    setEditPostContent('');
    setEditingPostId(null);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('確定要刪除這則留言嗎？')) return;

    setIsDeletingComment(prev => ({ ...prev, [commentId]: true }));
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setComments(comments.filter(c => c._id !== commentId));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setIsDeletingComment(prev => ({ ...prev, [commentId]: false }));
    }
  };

  const handleEditComment = (comment: Comment) => {
    if (!editCommentTextareaRefs.current[comment._id]) {
      editCommentTextareaRefs.current[comment._id] = { current: null };
    }
    setEditCommentContent(prev => ({ ...prev, [comment._id]: comment.content }));
    setEditingCommentId(comment._id);
    setIsEditingComment(prev => ({ ...prev, [comment._id]: true }));
    setTimeout(() => {
      editCommentTextareaRefs.current[comment._id]?.current?.focus();
    }, 0);
  };

  const handleSaveCommentEdit = async (commentId: string) => {
    const content = editCommentContent[commentId];
    if (!content || !content.trim() || content === comments.find(c => c._id === commentId)?.content) {
      setIsEditingComment(prev => ({ ...prev, [commentId]: false }));
      setEditingCommentId(null);
      return;
    }

    setIsEditingComment(prev => ({ ...prev, [commentId]: false }));
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments(comments.map(c => c._id === commentId ? data.comment : c));
        setEditingCommentId(null);
        setEditCommentContent(prev => {
          const newContent = { ...prev };
          delete newContent[commentId];
          return newContent;
        });
      }
    } catch (error) {
      console.error('Error editing comment:', error);
    }
  };

  const handleCancelCommentEdit = (commentId: string) => {
    setIsEditingComment(prev => ({ ...prev, [commentId]: false }));
    setEditingCommentId(null);
    setEditCommentContent(prev => {
      const newContent = { ...prev };
      delete newContent[commentId];
      return newContent;
    });
  };

  const handlePostClick = () => {
    if (onPostClick) {
      onPostClick();
    } else {
      router.push(`/post/${post._id}`);
    }
  };

  return (
    <article className="p-4 hover:bg-gray-50 transition-colors border-b border-gray-200">
      {(showRepostedBy || showLikedBy) && (
        <div className="mb-2 text-sm text-gray-500 flex items-center space-x-1">
          {showRepostedBy && (
            <>
              <HiArrowPathRoundedSquare className="w-4 h-4 text-green-500 fill-current" />
              <span>{showRepostedBy} reposted</span>
            </>
          )}
          {showLikedBy && (
            <>
              <HiHeart className="w-4 h-4 text-red-500 fill-current" />
              <span>{showLikedBy} liked</span>
            </>
          )}
        </div>
      )}
      <div className="flex items-start space-x-3">
        {post.authorImage && (
          <img
            src={post.authorImage}
            alt={post.authorName}
            className="w-12 h-12 rounded-full cursor-pointer"
            onClick={() => router.push(`/profile/${post.authorUserId}`)}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span
                className="font-semibold hover:underline cursor-pointer"
                onClick={() => router.push(`/profile/${post.authorUserId}`)}
              >
                {post.authorName}
              </span>
              <span
                className="text-gray-500 hover:underline cursor-pointer"
                onClick={() => router.push(`/profile/${post.authorUserId}`)}
              >
                @{post.authorUserId}
              </span>
              <span className="text-gray-500">·</span>
              <span className="text-gray-500 text-sm">{timeAgo}</span>
            </div>
            {session?.user?.id === post.authorId && !isRepost && (
              <div className="relative" ref={deleteMenuRef}>
                <button
                  onClick={() => setShowDeleteMenu(!showDeleteMenu)}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <HiEllipsisHorizontal className="w-5 h-5 text-gray-500" />
                </button>
                {showDeleteMenu && (
                  <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10 min-w-[120px]">
                    <button
                      onClick={handleEditPost}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors flex items-center space-x-2"
                    >
                      <HiPencil className="w-4 h-4" />
                      <span>編輯</span>
                    </button>
                    <button
                      onClick={handleDeletePost}
                      disabled={isDeleting}
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                      <HiTrash className="w-4 h-4" />
                      <span>{isDeleting ? '刪除中...' : '刪除'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div onClick={handlePostClick} className="cursor-pointer">
            {isEditingPost && editingPostId === post._id ? (
              <div className="mt-1">
                <MentionAutocomplete
                  value={editPostContent}
                  onChange={(newContent) => {
                    const newCount = calculateCharacterCount(newContent);
                    if (newCount <= 280) {
                      setEditPostContent(newContent);
                    }
                  }}
                  textareaRef={editPostTextareaRef}
                  placeholder="編輯貼文..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-sm ${calculateCharacterCount(editPostContent) > 280 ? 'text-red-500' : 'text-gray-500'}`}>
                    {calculateCharacterCount(editPostContent)}/280
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelPostEdit();
                      }}
                      className="px-4 py-1.5 border border-gray-300 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSavePostEdit();
                      }}
                      disabled={!editPostContent.trim() || editPostContent === post.content || calculateCharacterCount(editPostContent) > 280}
                      className="px-4 py-1.5 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      儲存
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-1 break-words">
                <TextWithMentions text={post.content} />
              </p>
            )}
          </div>
          <div className="flex items-center space-x-6 mt-3">
            {/* Comment Button - First */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (hideComments) {
                  handlePostClick();
                } else {
                  setShowCommentInput(!showCommentInput);
                }
              }}
              className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors"
            >
              <HiChatBubbleLeft className="w-5 h-5" />
              <span>{comments.length}</span>
            </button>
            {/* Repost Button - Second */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRepost();
              }}
              className={`flex items-center space-x-2 transition-colors ${
                isReposted
                  ? 'text-green-500 hover:text-green-600'
                  : 'text-gray-500 hover:text-green-500'
              }`}
            >
              <HiArrowPathRoundedSquare 
                className={`w-5 h-5 ${isReposted ? 'fill-current' : ''}`}
              />
              <span>{repostsCount}</span>
            </button>
            {/* Like Button - Third */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLike();
              }}
              className={`flex items-center space-x-2 transition-colors ${
                isLiked
                  ? 'text-red-500 hover:text-red-600'
                  : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <HiHeart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span>{likesCount}</span>
            </button>
          </div>

          {/* Comments Section - Only show if not hiding */}
          {!hideComments && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            {/* Comment Input - Show when clicking comment button */}
            {showCommentInput && (
              <form onSubmit={handleSubmitComment} className="mb-4">
                <div className="flex items-start space-x-2">
                  {session?.user?.image && (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'You'}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <div className="flex-1">
                    <MentionAutocomplete
                      value={commentContent}
                      onChange={setCommentContent}
                      textareaRef={commentTextareaRef}
                      placeholder="留下你的留言..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={2}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        type="submit"
                        disabled={!commentContent.trim() || isSubmittingComment}
                        className="px-4 py-1.5 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSubmittingComment ? '發送中...' : '留言'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* Comments List - Always visible */}
            <div className="space-y-4">
              {commentsLoading ? (
                <p className="text-gray-500 text-sm text-center py-4">
                  載入留言中...
                </p>
              ) : comments.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">
                  還沒有留言，成為第一個留言的人吧！
                </p>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment._id}
                    className="flex items-start space-x-2 pb-3 border-b border-gray-100 last:border-b-0"
                  >
                    {comment.authorImage && (
                      <img
                        src={comment.authorImage}
                        alt={comment.authorName}
                        className="w-8 h-8 rounded-full cursor-pointer"
                        onClick={() =>
                          router.push(`/profile/${comment.authorUserId}`)
                        }
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span
                            className="font-semibold text-sm hover:underline cursor-pointer"
                            onClick={() =>
                              router.push(`/profile/${comment.authorUserId}`)
                            }
                          >
                            {comment.authorName}
                          </span>
                          <span className="text-gray-500 text-sm">
                            @{comment.authorUserId}
                          </span>
                          <span className="text-gray-500 text-sm">·</span>
                          <span className="text-gray-500 text-sm">
                            {formatDistanceToNow(new Date(comment.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        {session?.user?.id === comment.authorId && (
                          <div className="relative" ref={(el) => {
                            if (el) {
                              commentMenuRefs.current[comment._id] = el;
                            } else {
                              delete commentMenuRefs.current[comment._id];
                            }
                          }}>
                            <button
                              onClick={() => setShowCommentMenu(prev => ({
                                ...prev,
                                [comment._id]: !prev[comment._id]
                              }))}
                              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                            >
                              <HiEllipsisHorizontal className="w-4 h-4 text-gray-500" />
                            </button>
                            {showCommentMenu[comment._id] && (
                              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10 min-w-[120px]">
                                <button
                                  onClick={() => {
                                    handleEditComment(comment);
                                    setShowCommentMenu(prev => ({ ...prev, [comment._id]: false }));
                                  }}
                                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors flex items-center space-x-2"
                                >
                                  <HiPencil className="w-4 h-4" />
                                  <span>編輯</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setShowCommentMenu(prev => ({ ...prev, [comment._id]: false }));
                                    handleDeleteComment(comment._id);
                                  }}
                                  disabled={isDeletingComment[comment._id]}
                                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center space-x-2"
                                >
                                  <HiTrash className="w-4 h-4" />
                                  <span>{isDeletingComment[comment._id] ? '刪除中...' : '刪除'}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {isEditingComment[comment._id] && editingCommentId === comment._id ? (
                        <div className="mt-2">
                          <MentionAutocomplete
                            value={editCommentContent[comment._id] || ''}
                            onChange={(newContent) => {
                              const newCount = calculateCharacterCount(newContent);
                              if (newCount <= 280) {
                                setEditCommentContent(prev => ({
                                  ...prev,
                                  [comment._id]: newContent
                                }));
                              }
                            }}
                            textareaRef={editCommentTextareaRefs.current[comment._id]}
                            placeholder="編輯留言..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            rows={3}
                          />
                          <div className="flex items-center justify-between mt-2">
                            <span className={`text-xs ${calculateCharacterCount(editCommentContent[comment._id] || '') > 280 ? 'text-red-500' : 'text-gray-500'}`}>
                              {calculateCharacterCount(editCommentContent[comment._id] || '')}/280
                            </span>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleCancelCommentEdit(comment._id)}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                              >
                                取消
                              </button>
                              <button
                                onClick={() => handleSaveCommentEdit(comment._id)}
                                disabled={!editCommentContent[comment._id]?.trim() || editCommentContent[comment._id] === comment.content || calculateCharacterCount(editCommentContent[comment._id] || '') > 280}
                                className="px-3 py-1 text-sm bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                儲存
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-1 text-sm break-words">
                          <TextWithMentions text={comment.content} />
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          )}
        </div>
      </div>
    </article>
  );
}

