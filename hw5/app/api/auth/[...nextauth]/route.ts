import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import FacebookProvider from 'next-auth/providers/facebook';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { getPendingUserIdByEmail } from '../pending-userid/route';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        userId: { label: 'User ID', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.userId) {
          throw new Error('User ID is required');
        }

        const user = await prisma.user.findUnique({
          where: { userId: credentials.userId },
        });

        if (!user) {
          throw new Error('User not found');
        }

        // Only allow login if user has an OAuth account linked (no password required)
        const account = await prisma.account.findFirst({
          where: { userId: user.id },
        });

        if (!account) {
          throw new Error('Please sign in with OAuth first');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          userId: user.userId || undefined,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token, user }) {
      if (session.user) {
        const userId = (user as any)?.id || token.sub;
        session.user.id = userId;
        
        // Always fetch latest user info from database to ensure we have the latest image
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { userId: true, name: true, image: true },
          });
          
          if (dbUser) {
            session.user.userId = dbUser.userId || token.userId || undefined;
            session.user.name = dbUser.name || session.user.name;
            session.user.image = dbUser.image || session.user.image;
          } else {
            session.user.userId = token.userId || undefined;
          }
        } catch (error) {
          console.error('Error fetching user info in session:', error);
          session.user.userId = token.userId || undefined;
        }
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = (user as any).id;
        // Get userId from database if not in token
        if (!token.userId && (user as any).id) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: (user as any).id },
              select: { userId: true },
            });
            token.userId = dbUser?.userId || undefined;
          } catch (error) {
            console.error('Error fetching userId:', error);
            token.userId = undefined;
          }
        }
      }
      return token;
    },
    async signIn({ user, account, profile }) {
      // Check if this is an OAuth sign-in (not credentials)
      if (account && account.provider !== 'credentials' && user.email) {
        try {
          // Check if a user with this email already exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: { accounts: true },
          });

          if (existingUser) {
            // Check if this user already has an account with the same provider
            const hasThisProvider = existingUser.accounts.some(
              (acc) => acc.provider === account.provider && acc.providerAccountId === account.providerAccountId
            );

            if (hasThisProvider) {
              // User is logging in with existing provider - allow
              return true;
            }

            // If user exists but doesn't have this provider, allow linking the new provider
            // This allows users to use any OAuth provider to log in, even if they registered with a different one
            // The PrismaAdapter will handle linking the account to the existing user
            return true;
          }
        } catch (error) {
          console.error('Error checking account linking:', error);
          // Continue with sign-in if there's an error
        }
      }

      // Allow all other sign-in attempts
      // For new OAuth users with pending userId, set it in the event handler
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Always allow external URLs (OAuth providers)
      try {
        const urlObj = new URL(url);
        if (urlObj.origin !== baseUrl) {
          return url;
        }
      } catch {
        // If url is not a valid URL, treat it as relative
      }
      
      // Handle relative URLs
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      // If url is already absolute and same origin, return it
      if (url.startsWith(baseUrl)) {
        return url;
      }
      
      // Default to baseUrl for invalid URLs
      return baseUrl;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      // If this is a new OAuth user, try to set userId from pending registration
      // Note: This may not work if userId was stored by token (before we have email)
      // In that case, it will be set in register-complete page
      if (isNewUser && account?.provider !== 'credentials' && user?.email && user?.id) {
        try {
          const pendingUserId = getPendingUserIdByEmail(user.email);
          
          if (pendingUserId) {
            // Check if userId is still available
            const existingUser = await prisma.user.findUnique({
              where: { userId: pendingUserId },
            });

            if (!existingUser) {
              // Set userId immediately for the new user
              await prisma.user.update({
                where: { id: user.id },
                data: { userId: pendingUserId },
              });
            }
          }
        } catch (error) {
          console.error('Error setting userId in signIn event:', error);
          // Continue even if setting userId fails - user can set it later
        }
      }
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

