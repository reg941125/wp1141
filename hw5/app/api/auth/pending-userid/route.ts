import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Temporary storage for pending userId during OAuth registration
// Using token-based storage instead of email-based (since we don't have email before OAuth)
const pendingUserIdByToken = new Map<string, { userId: string; provider: string; expiresAt: number }>();
const pendingUserIdByEmail = new Map<string, { userId: string; provider: string; expiresAt: number }>();

// Clean up expired entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of pendingUserIdByToken.entries()) {
    if (data.expiresAt < now) {
      pendingUserIdByToken.delete(key);
    }
  }
  for (const [key, data] of pendingUserIdByEmail.entries()) {
    if (data.expiresAt < now) {
      pendingUserIdByEmail.delete(key);
    }
  }
}, 10 * 60 * 1000);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, email, userId, provider } = body;

    // Support both token-based (before OAuth) and email-based (after OAuth) storage
    if (token && userId && provider) {
      // Store pending userId with token (expires in 10 minutes)
      pendingUserIdByToken.set(token, {
        userId,
        provider,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      });
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (email && userId && provider) {
      // Store pending userId with email (expires in 10 minutes)
      pendingUserIdByEmail.set(email.toLowerCase(), {
        userId,
        provider,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      });
      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json(
      { error: 'Missing required fields (token or email, userId, provider)' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Pending userId error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (token) {
      const pending = pendingUserIdByToken.get(token);
      if (!pending) {
        return NextResponse.json({ pending: null }, { status: 200 });
      }
      if (pending.expiresAt < Date.now()) {
        pendingUserIdByToken.delete(token);
        return NextResponse.json({ pending: null }, { status: 200 });
      }
      return NextResponse.json({ pending }, { status: 200 });
    }

    if (email) {
      const pending = pendingUserIdByEmail.get(email.toLowerCase());
      if (!pending) {
        return NextResponse.json({ pending: null }, { status: 200 });
      }
      if (pending.expiresAt < Date.now()) {
        pendingUserIdByEmail.delete(email.toLowerCase());
        return NextResponse.json({ pending: null }, { status: 200 });
      }
      return NextResponse.json({ pending }, { status: 200 });
    }

    return NextResponse.json(
      { error: 'Token or email is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Get pending userId error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export functions for NextAuth to access
export function getPendingUserIdByToken(token: string) {
  const pending = pendingUserIdByToken.get(token);
  if (pending && pending.expiresAt > Date.now()) {
    return pending.userId;
  }
  if (pending) {
    pendingUserIdByToken.delete(token);
  }
  return null;
}

export function getPendingUserIdByEmail(email: string) {
  const pending = pendingUserIdByEmail.get(email.toLowerCase());
  if (pending && pending.expiresAt > Date.now()) {
    return pending.userId;
  }
  if (pending) {
    pendingUserIdByEmail.delete(email.toLowerCase());
  }
  return null;
}

export function deletePendingUserIdByToken(token: string) {
  pendingUserIdByToken.delete(token);
}

export function deletePendingUserIdByEmail(email: string) {
  pendingUserIdByEmail.delete(email.toLowerCase());
}

