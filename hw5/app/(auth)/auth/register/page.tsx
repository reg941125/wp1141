'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type OAuthProvider = 'google' | 'github' | 'facebook';

export default function RegisterPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedProvider, setSelectedProvider] = useState<OAuthProvider | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleProviderSelect = (provider: OAuthProvider) => {
    setSelectedProvider(provider);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProvider) {
      setError('請選擇 OAuth Provider');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // If user is already logged in, sign them out first to prevent session conflict
      if (session) {
        await signOut({ redirect: false });
      }

      // Initiate OAuth sign in
      // After OAuth callback, user will be redirected to setup-userid page
      console.log('Starting OAuth sign in with provider:', selectedProvider);
      
      // Redirect to OAuth provider, then to setup-userid after authentication
      signIn(selectedProvider, {
        callbackUrl: '/auth/setup-userid',
        redirect: true, // This will cause automatic redirect to OAuth provider
      });
      
      // Note: With redirect: true, execution will stop here and redirect happens
      // If redirect fails, user will see an error page
    } catch (err) {
      console.error('Registration error:', err);
      setError('註冊過程中發生錯誤');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">註冊 X</h2>
          <p className="mt-2 text-sm text-gray-600">建立你的帳號</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* OAuth Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              選擇註冊方式
            </label>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleProviderSelect('google')}
                className={`w-full flex items-center justify-center rounded-md border-2 px-4 py-3 text-sm font-medium transition-colors ${
                  selectedProvider === 'google'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 bg-white hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleProviderSelect('github')}
                className={`w-full flex items-center justify-center rounded-md border-2 px-4 py-3 text-sm font-medium transition-colors ${
                  selectedProvider === 'github'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 bg-white hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span>GitHub</span>
              </button>

              <button
                type="button"
                onClick={() => handleProviderSelect('facebook')}
                className={`w-full flex items-center justify-center rounded-md border-2 px-4 py-3 text-sm font-medium transition-colors ${
                  selectedProvider === 'facebook'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 bg-white hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5 mr-2" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Facebook</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="text-center text-sm text-red-600">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || !selectedProvider}
              className="w-full rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? '處理中...' : '繼續'}
            </button>
          </div>
          <p className="text-center text-xs text-gray-500">
            認證完成後，您將被引導至設定 User ID 頁面
          </p>
        </form>

        <div className="text-center text-sm">
          <span className="text-gray-600">已有帳號？ </span>
          <a href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
            登入
          </a>
        </div>
      </div>
    </div>
  );
}

