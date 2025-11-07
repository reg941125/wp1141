import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // If user is authenticated but doesn't have userId, redirect to setup
    if (token && !token.userId && path !== '/auth/setup-userid') {
      return NextResponse.redirect(new URL('/auth/setup-userid', req.url));
    }

    // If user has userId and is on setup page, redirect to home
    if (token && token.userId && path === '/auth/setup-userid') {
      return NextResponse.redirect(new URL('/home', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/auth/signin',
    },
  }
);

export const config = {
  matcher: ['/home/:path*', '/profile/:path*', '/auth/setup-userid'],
};

