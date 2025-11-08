'use client';

import { signIn } from 'next-auth/react';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function SignInForm() {
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

  const handleOAuthSignIn = async (provider: 'google' | 'github' | 'facebook') => {
    setLoading(true);
    setError('');
    
    try {
      await signIn(provider, {
        callbackUrl: '/home',
        redirect: true,
      });
    } catch (err) {
      console.error('OAuth sign in error:', err);
      setError('OAuth 登入失敗，請再試一次');
      setLoading(false);
    }
  };

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

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">或</span>
          </div>
        </div>

        {/* OAuth Sign In Options */}
        <div className="space-y-3">
          <button
            onClick={() => handleOAuthSignIn('google')}
            disabled={loading}
            className="w-full flex items-center justify-center rounded-md border-2 border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>使用 Google 登入</span>
          </button>

          <button
            onClick={() => handleOAuthSignIn('github')}
            disabled={loading}
            className="w-full flex items-center justify-center rounded-md border-2 border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span>使用 GitHub 登入</span>
          </button>

          <button
            onClick={() => handleOAuthSignIn('facebook')}
            disabled={loading}
            className="w-full flex items-center justify-center rounded-md border-2 border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5 mr-2" fill="#1877F2" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span>使用 Facebook 登入</span>
          </button>
        </div>

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

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">登入 X</h2>
            <p className="mt-2 text-sm text-gray-600">載入中...</p>
          </div>
        </div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}
