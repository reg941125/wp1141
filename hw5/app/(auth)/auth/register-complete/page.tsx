'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RegisterCompletePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const completeRegistration = async () => {
      if (status === 'loading') return;

      if (status === 'unauthenticated') {
        router.push('/auth/register');
        return;
      }

      if (!session?.user) {
        router.push('/auth/register');
        return;
      }

      // Get pending userId from sessionStorage
      const pendingUserId = sessionStorage.getItem('pending_userId');
      const pendingProvider = sessionStorage.getItem('pending_provider');

      // Check if userId was already set by NextAuth event (during OAuth callback)
      if (session.user.userId) {
        // UserId was already set, clear sessionStorage and redirect to home
        sessionStorage.removeItem('pending_userId');
        sessionStorage.removeItem('pending_provider');
        router.push('/home');
        return;
      }

      if (!pendingUserId) {
        // No pending registration, redirect to home or register
        if (session.user.userId) {
          router.push('/home');
        } else {
          router.push('/auth/register');
        }
        return;
      }

      // If userId wasn't set by NextAuth event, set it now
      try {
        // Get token from cookie or sessionStorage
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('pending_token='))
          ?.split('=')[1] || sessionStorage.getItem('pending_token');

        // If we have a token, get userId from server
        let userIdToSet = pendingUserId;
        if (token) {
          const tokenRes = await fetch(`/api/auth/pending-userid?token=${token}`);
          if (tokenRes.ok) {
            const tokenData = await tokenRes.json();
            if (tokenData.pending) {
              userIdToSet = tokenData.pending.userId;
              // Also store by email for future lookups
              if (session.user.email) {
                await fetch('/api/auth/pending-userid', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    email: session.user.email,
                    userId: userIdToSet,
                    provider: pendingProvider || 'unknown',
                  }),
                });
              }
            }
          }
          // Clear token cookie
          document.cookie = 'pending_token=; path=/; max-age=0';
        }

        // Set userId immediately for the newly created user
        // This happens right after OAuth callback creates the user
        const res = await fetch('/api/auth/setup-userid', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: userIdToSet }),
        });

        const data = await res.json();

        if (!res.ok) {
          console.error('Failed to set userId:', data.error);
          // Clear sessionStorage and redirect to register
          sessionStorage.removeItem('pending_userId');
          sessionStorage.removeItem('pending_provider');
          router.push('/auth/register');
          return;
        }

        // Clear sessionStorage
        sessionStorage.removeItem('pending_userId');
        sessionStorage.removeItem('pending_provider');

        // Update session
        await update();

        // Redirect to home
        router.push('/home');
      } catch (error) {
        console.error('Registration complete error:', error);
        sessionStorage.removeItem('pending_userId');
        sessionStorage.removeItem('pending_provider');
        router.push('/auth/register');
      } finally {
        setLoading(false);
      }
    };

    completeRegistration();
  }, [status, session, router, update]);

  if (loading || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">處理中...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-lg">註冊完成中...</div>
    </div>
  );
}

