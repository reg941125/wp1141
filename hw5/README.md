# X Clone

A full-stack Twitter/X clone built with Next.js 16, NextAuth, PostgreSQL, MongoDB, and Pusher.

## Features

- **Authentication**: OAuth with Google, GitHub, and Facebook, plus email/password authentication
- **Posts**: Create, view, like, and repost posts
- **User Profiles**: View and edit profiles with custom avatars and cover images
- **Follow System**: Follow and unfollow users
- **Real-time Updates**: Live updates for likes, reposts, and comments using Pusher
- **Feed**: View posts from all users or only from users you follow

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React, Tailwind CSS
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: PostgreSQL (Prisma ORM) + MongoDB (Mongoose)
- **Real-time**: Pusher
- **Authentication**: NextAuth.js with OAuth providers

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- MongoDB database
- Pusher account
- OAuth app credentials (Google, GitHub, Facebook)

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up environment variables. Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/xclone?schema=public"
MONGODB_URI="mongodb://localhost:27017/xclone"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# OAuth - Google
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# OAuth - GitHub
GITHUB_ID="your-github-id"
GITHUB_SECRET="your-github-secret"

# OAuth - Facebook
FACEBOOK_CLIENT_ID="your-facebook-client-id"
FACEBOOK_CLIENT_SECRET="your-facebook-client-secret"

# Pusher
PUSHER_APP_ID="your-pusher-app-id"
PUSHER_KEY="your-pusher-key"
PUSHER_SECRET="your-pusher-secret"
PUSHER_CLUSTER="your-pusher-cluster"
```

3. Generate Prisma client and run migrations:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
hw5/
├── app/
│   ├── (auth)/              # Authentication pages
│   │   └── auth/
│   │       ├── signin/      # Sign in page
│   │       └── signup/      # Sign up page
│   ├── (main)/              # Main application pages
│   │   ├── layout.tsx       # Main layout with sidebar
│   │   ├── home/            # Home feed page
│   │   └── profile/[userId]/ # User profile page
│   ├── api/
│   │   ├── auth/            # Authentication API routes
│   │   ├── posts/           # Posts API routes
│   │   └── users/           # Users API routes
│   └── layout.tsx           # Root layout
├── components/
│   ├── Sidebar.tsx          # Main sidebar navigation
│   ├── PostCard.tsx         # Post display component
│   ├── PostDialog.tsx       # Create post dialog
│   ├── EditProfileDialog.tsx # Edit profile dialog
│   ├── FollowButton.tsx     # Follow/unfollow button
│   └── SessionProvider.tsx  # NextAuth session provider
├── lib/
│   ├── prisma.ts            # Prisma client
│   ├── mongodb.ts           # MongoDB connection
│   └── pusher.ts            # Pusher configuration
├── prisma/
│   └── schema.prisma        # Database schema
└── types/
    └── next-auth.d.ts       # NextAuth type definitions
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `GET/POST /api/auth/[...nextauth]` - NextAuth endpoints

### Posts
- `GET /api/posts` - Get all posts (or posts from following)
- `POST /api/posts` - Create new post
- `POST /api/posts/[postId]/like` - Like/unlike post
- `POST /api/posts/[postId]/repost` - Repost/undo repost

### Users
- `GET /api/users/[userId]` - Get user profile
- `PATCH /api/users/[userId]` - Update user profile
- `GET /api/users/[userId]/posts` - Get user's posts
- `POST /api/users/[userId]/follow` - Follow user
- `DELETE /api/users/[userId]/follow` - Unfollow user

## Deployment

1. Set up your production databases (PostgreSQL and MongoDB)
2. Configure environment variables on your hosting platform
3. Deploy to Vercel, Netlify, or your preferred platform
4. Run database migrations in production

## License

MIT
