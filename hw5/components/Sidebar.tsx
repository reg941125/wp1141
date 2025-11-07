'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { HiHome, HiUser, HiPlus, HiBell, HiDocumentText } from 'react-icons/hi';
import PostDialog from './PostDialog';
import UserSearch from './UserSearch';

export default function Sidebar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [showLogout, setShowLogout] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch unread notifications count
  const fetchUnreadCount = async () => {
    if (!session?.user?.id) return;
    
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        const unread = (data.notifications || []).filter((n: any) => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchUnreadCount();
      
      // Set up Pusher for real-time notifications
      if (typeof window !== 'undefined') {
        const Pusher = require('pusher-js');
        const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY || '';
        const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2';
        
        if (pusherKey) {
          const pusher = new Pusher(pusherKey, {
            cluster: pusherCluster,
          });

          const channel = pusher.subscribe(`user-${session.user.id}`);
          channel.bind('new-notification', () => {
            fetchUnreadCount();
          });

          return () => {
            channel.unbind_all();
            pusher.unsubscribe(`user-${session.user.id}`);
            pusher.disconnect();
          };
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowLogout(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!session) {
    return null;
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/signin' });
  };

  return (
    <>
      <aside className="sticky top-0 h-screen w-64 border-r border-gray-200 flex flex-col">
        <div className="flex-1 flex flex-col items-start p-4 space-y-2">
          {/* Logo */}
          <div className="px-4 py-2 mb-4">
            <h1 className="text-2xl font-bold">X</h1>
          </div>

          {/* User Search */}
          <div className="px-4 w-full">
            <UserSearch />
          </div>

          {/* Navigation */}
          <nav className="w-full space-y-1">
            <button
              onClick={() => router.push('/home')}
              className="flex items-center space-x-3 px-4 py-3 w-full rounded-full hover:bg-gray-100 transition-colors text-left"
            >
              <HiHome className="text-2xl" />
              <span className="text-lg">Home</span>
            </button>

            <button
              onClick={() => router.push(`/profile/${session.user.userId}`)}
              className="flex items-center space-x-3 px-4 py-3 w-full rounded-full hover:bg-gray-100 transition-colors text-left"
            >
              <HiUser className="text-2xl" />
              <span className="text-lg">Profile</span>
            </button>

            <button
              onClick={() => router.push('/notifications')}
              className="flex items-center space-x-3 px-4 py-3 w-full rounded-full hover:bg-gray-100 transition-colors text-left relative"
            >
              <HiBell className="text-2xl" />
              <span className="text-lg">Notifications</span>
              {unreadCount > 0 && (
                <span className="absolute left-6 top-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => router.push('/drafts')}
              className="flex items-center space-x-3 px-4 py-3 w-full rounded-full hover:bg-gray-100 transition-colors text-left"
            >
              <HiDocumentText className="text-2xl" />
              <span className="text-lg">Drafts</span>
            </button>

            <button
              onClick={() => setShowPostDialog(true)}
              className="flex items-center space-x-3 px-4 py-3 w-full rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors text-left"
            >
              <HiPlus className="text-2xl" />
              <span className="text-lg">Post</span>
            </button>
          </nav>
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-t border-gray-200">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowLogout(!showLogout)}
              className="flex items-center space-x-3 w-full rounded-full p-3 hover:bg-gray-100 transition-colors"
            >
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div className="flex-1 text-left">
                <p className="font-semibold text-sm">{session.user.name}</p>
                <p className="text-sm text-gray-600">@{session.user.userId}</p>
              </div>
            </button>

            {showLogout && (
              <div className="absolute bottom-full mb-2 left-0 w-64 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors"
                >
                  Log out @{session.user.userId}
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {showPostDialog && (
        <PostDialog onClose={() => setShowPostDialog(false)} />
      )}
    </>
  );
}

