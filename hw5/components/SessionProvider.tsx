'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextAuthSessionProvider
      refetchInterval={0} // 禁用自動重新獲取
      refetchOnWindowFocus={false} // 禁用視窗聚焦時重新獲取
    >
      {children}
    </NextAuthSessionProvider>
  );
}

