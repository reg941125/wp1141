'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { HiArrowLeft, HiTrash, HiPencil } from 'react-icons/hi2';
import { formatDistanceToNow } from 'date-fns';
import PostDialog from '@/components/PostDialog';

interface Draft {
  id: string;
  content: string;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function DraftsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDraft, setEditingDraft] = useState<Draft | null>(null);
  const [showPostDialog, setShowPostDialog] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && session) {
      fetchDrafts();
    }
  }, [status, session, router]);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/drafts');
      if (res.ok) {
        const data = await res.json();
        setDrafts(data.drafts || []);
      }
    } catch (error) {
      console.error('Error fetching drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    if (!confirm('確定要刪除這個草稿嗎？')) return;

    try {
      const res = await fetch(`/api/drafts?id=${draftId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setDrafts(drafts.filter((d) => d.id !== draftId));
      }
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  };

  const handleEditDraft = (draft: Draft) => {
    setEditingDraft(draft);
    setShowPostDialog(true);
  };

  const handlePostDialogClose = () => {
    setShowPostDialog(false);
    setEditingDraft(null);
    fetchDrafts();
  };

  if (status === 'loading' || !session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <>
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
              <h1 className="text-xl font-bold">草稿</h1>
            </div>
          </div>
        </div>

        {/* Drafts List */}
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-8 text-center text-gray-500">載入中...</div>
          ) : drafts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">沒有草稿</div>
          ) : (
            drafts.map((draft) => (
              <div
                key={draft.id}
                className="p-4 hover:bg-gray-50 transition-colors border-b border-gray-200"
              >
                <div className="flex items-start space-x-3">
                  {session?.user?.image && (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      className="w-12 h-12 rounded-full flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(draft.updatedAt), {
                          addSuffix: true,
                        })}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditDraft(draft)}
                          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                          title="編輯"
                        >
                          <HiPencil className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteDraft(draft.id)}
                          className="p-2 hover:bg-red-100 rounded-full transition-colors"
                          title="刪除"
                        >
                          <HiTrash className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                    <p className="break-words whitespace-pre-wrap">{draft.content}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showPostDialog && editingDraft && (
        <PostDialog
          onClose={handlePostDialogClose}
          initialContent={editingDraft.content}
          draftId={editingDraft.id}
        />
      )}
    </>
  );
}