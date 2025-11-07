'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function SetupUserIdPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && session?.user?.userId) {
      // Already has userId, redirect to home
      router.push('/home');
    }
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!userId.trim()) {
      setError('User ID is required');
      setLoading(false);
      return;
    }

    // Validate userId format
    const userIdRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!userIdRegex.test(userId)) {
      setError('User ID must be 3-20 characters and contain only letters, numbers, underscores, or hyphens');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/setup-userid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to set user ID');
        setLoading(false);
        return;
      }

      // Update session to include userId
      await update();
      
      // Wait a bit for session to update, then redirect to signin with userId parameter
      setTimeout(() => {
        window.location.href = `/auth/signin?registeredUserId=${encodeURIComponent(userId)}`;
      }, 500);
    } catch (error) {
      console.error('Setup userId error:', error);
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">設定你的 User ID</h2>
          <p className="mt-2 text-sm text-gray-600">
            歡迎！請選擇一個唯一的 User ID 來完成註冊
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
              User ID
            </label>
            <input
              id="userId"
              name="userId"
              type="text"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              placeholder="例如: ric2k1"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              pattern="[a-zA-Z0-9_-]{3,20}"
              maxLength={20}
            />
            <p className="mt-1 text-xs text-gray-500">
              3-20 個字符，只能包含字母、數字、底線或連字號
            </p>
            <p className="mt-1 text-xs text-gray-500">
              此 User ID 將用於之後登入，例如：@{userId || 'youruserid'}
            </p>
          </div>

          {error && (
            <div className="text-center text-sm text-red-600">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || !userId.trim()}
              className="w-full rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? '設定中...' : '完成註冊'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

