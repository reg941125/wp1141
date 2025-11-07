'use client';

import { useSession } from 'next-auth/react';
import { useState, useRef } from 'react';
import MentionAutocomplete from './MentionAutocomplete';
import { calculateCharacterCount } from '@/lib/utils/characterCount';

interface InlinePostProps {
  onPostCreated?: () => void;
  parentCommentId?: string; // For replying to comments
  postId?: string; // For commenting on posts
  placeholder?: string;
}

export default function InlinePost({ onPostCreated, parentCommentId, postId, placeholder = '有什麼新鮮事?' }: InlinePostProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const characterCount = calculateCharacterCount(content);
  const maxCharacters = 280;
  const canSubmit = characterCount <= maxCharacters && content.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError('');

    try {
      if (parentCommentId) {
        // Create reply to comment
        const res = await fetch(`/api/comments/${parentCommentId}/replies`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Failed to create reply');
          return;
        }
      } else if (postId) {
        // Create comment on post
        const res = await fetch(`/api/posts/${postId}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Failed to create comment');
          return;
        }
      } else {
        // Create post
        const res = await fetch('/api/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Failed to create post');
          return;
        }
      }

      // Success - reset form
      setContent('');
      setExpanded(false);
      if (onPostCreated) {
        onPostCreated();
      } else {
        window.location.reload();
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (newContent: string) => {
    const newCount = calculateCharacterCount(newContent);
    if (newCount <= maxCharacters) {
      setContent(newContent);
    }
  };

  if (!expanded) {
    return (
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start space-x-3">
          {session?.user?.image && (
            <img
              src={session.user.image}
              alt={session.user.name || 'User'}
              className="w-12 h-12 rounded-full flex-shrink-0"
            />
          )}
          <div className="flex-1">
            <button
              onClick={() => setExpanded(true)}
              className="w-full text-left text-gray-500 hover:text-gray-700 transition-colors"
            >
              <span className="text-lg">{placeholder}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-b border-gray-200">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start space-x-3">
          {session?.user?.image && (
            <img
              src={session.user.image}
              alt={session.user.name || 'User'}
              className="w-12 h-12 rounded-full flex-shrink-0"
            />
          )}
          <div className="flex-1">
              <MentionAutocomplete
                value={content}
                onChange={handleContentChange}
                textareaRef={textareaRef}
                placeholder={placeholder}
                className="w-full min-h-[120px] resize-none border-none focus:outline-none text-lg"
                rows={5}
              />
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-4">
              </div>
              <div className="flex items-center space-x-4">
                <span className={`text-sm ${characterCount > maxCharacters ? 'text-red-500' : 'text-gray-500'}`}>
                  {characterCount}/{maxCharacters}
                </span>
                {error && (
                  <span className="text-sm text-red-600">{error}</span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setExpanded(false);
                    setContent('');
                    setError('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-full font-semibold hover:bg-gray-100"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit || loading}
                  className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Posting...' : '發佈'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

