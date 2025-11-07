'use client';

import { signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);

  // Check for registered userId and success message
  useEffect(() => {
    const registeredUserIdParam = searchParams.get('registeredUserId');
    if (registeredUserIdParam) {
      setRegisteredUserId(registeredUserIdParam);
      setUserId(registeredUserIdParam);
      setShowSuccessMessage(true);
      // Clear the parameter from URL
      router.replace('/auth/signin', { scroll: false });
    }
  }, [searchParams, router]);

  // Check for error from OAuth callback
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      if (errorParam === 'OAuthAccountNotLinked') {
        setError('此 email 已經與其他登入方式（Google/GitHub/Facebook）關聯。請使用原本的登入方式登入，或聯繫客服處理。');
      } else if (errorParam === 'Callback' || errorParam === 'OAuthCreateAccount') {
        setError('OAuth 認證失敗，請檢查 OAuth 設定或再試一次。如果這是註冊流程，請確認 OAuth 憑證配置正確。');
      } else if (errorParam === 'google' || errorParam === 'github' || errorParam === 'facebook') {
        setError(`OAuth ${errorParam} 認證失敗，請檢查 ${errorParam.toUpperCase()} OAuth 憑證設定是否正確，或再試一次。`);
      } else {
        setError('登入失敗：' + errorParam);
      }
    }
  }, [searchParams]);

  const handleUserIdInput = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!userId.trim()) {
      setError('請輸入 User ID');
      setLoading(false);
      return;
    }

    try {
      // Get user's provider
      const res = await fetch('/api/auth/get-provider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '找不到此 User ID');
        setLoading(false);
        return;
      }

      // Redirect to OAuth login with the correct provider
      await signIn(data.provider, {
        callbackUrl: '/home',
        redirect: true,
      });
    } catch (err) {
      console.error('Login error:', err);
      setError('登入過程中發生錯誤');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">登入 X</h2>
          <p className="mt-2 text-sm text-gray-600">歡迎回來！</p>
        </div>

        {/* User ID Input */}
        {showSuccessMessage && registeredUserId && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  註冊成功！請使用剛剛設定的 User ID 登入
                </p>
                <p className="mt-1 text-sm text-green-700">
                  您的 User ID: <span className="font-semibold">@{registeredUserId}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleUserIdInput} className="space-y-4">
          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
              輸入 User ID
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
              disabled={loading}
            />
          </div>

          {error && (
            <div className="text-center text-sm text-red-600">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading || !userId.trim()}
            className="w-full rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? '登入中...' : '登入'}
          </button>
        </form>

        <div className="text-center text-sm pt-4 border-t border-gray-200">
          <span className="text-gray-600">首次使用？ </span>
          <a href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
            註冊
          </a>
        </div>
      </div>
    </div>
  );
}
