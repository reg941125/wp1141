'use client';

import { useSession } from 'next-auth/react';
import { useState, useRef } from 'react';
import { HiXMark } from 'react-icons/hi2';
import MentionAutocomplete from './MentionAutocomplete';
import { calculateCharacterCount } from '@/lib/utils/characterCount';

interface PostDialogProps {
  onClose: () => void;
  initialContent?: string;
  draftId?: string;
}

interface ConfirmDialogProps {
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

function ConfirmDialog({ onSave, onDiscard, onCancel }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <h3 className="text-xl font-bold mb-4">放棄發文？</h3>
        <p className="text-gray-600 mb-6">
          你的內容將會被儲存為草稿，或者你可以選擇放棄。
        </p>
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full font-semibold hover:bg-gray-100"
          >
            取消
          </button>
          <button
            onClick={onSave}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600"
          >
            儲存草稿
          </button>
          <button
            onClick={onDiscard}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600"
          >
            放棄
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PostDialog({ onClose, initialContent = '', draftId }: PostDialogProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const characterCount = calculateCharacterCount(content);
  const maxCharacters = 280;
  const canSubmit = characterCount <= maxCharacters && content.trim();

  const handleClose = () => {
    if (content.trim()) {
      setShowConfirmDialog(true);
    } else {
      onClose();
    }
  };

  const handleSaveDraft = async () => {
    try {
      // Save draft
      await fetch('/api/drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      // Delete old draft if editing
      if (draftId) {
        await fetch(`/api/drafts?id=${draftId}`, {
          method: 'DELETE',
        });
      }

      // Reset and close
      setContent('');
      setShowConfirmDialog(false);
      onClose();
    } catch (error) {
      console.error('Error saving draft:', error);
      setError('Failed to save draft');
    }
  };

  const handleDiscard = () => {
    setContent('');
    setShowConfirmDialog(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError('');

    try {
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

      // Success
      // Delete draft if editing
      if (draftId) {
        await fetch(`/api/drafts?id=${draftId}`, {
          method: 'DELETE',
        });
      }

      setContent('');
      onClose();
      // Refresh the page to show new post
      window.location.reload();
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Prevent input when character count exceeds limit
  const handleContentChange = (newContent: string) => {
    const newCount = calculateCharacterCount(newContent);
    if (newCount <= maxCharacters) {
      setContent(newContent);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
        <div className="bg-white rounded-2xl w-full max-w-lg my-8 max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <HiXMark className="text-xl" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-4 overflow-y-auto flex-1">
              <div className="flex space-x-4">
                {session?.user?.image && (
                  <div className="flex-shrink-0">
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      className="w-12 h-12 rounded-full"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <MentionAutocomplete
                    value={content}
                    onChange={handleContentChange}
                    textareaRef={textareaRef}
                    placeholder="有什麼新鮮事?"
                    className="w-full min-h-[120px] resize-none border-none focus:outline-none text-lg"
                    rows={5}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 pt-4 border-t border-gray-200 flex-shrink-0">
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
                  type="submit"
                  disabled={!canSubmit || loading}
                  className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Posting...' : '發佈'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {showConfirmDialog && (
        <ConfirmDialog
          onSave={handleSaveDraft}
          onDiscard={handleDiscard}
          onCancel={() => setShowConfirmDialog(false)}
        />
      )}
    </>
  );
}
