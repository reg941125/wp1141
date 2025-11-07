'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { HiArrowLeft, HiHeart, HiArrowPathRoundedSquare, HiChatBubbleLeft, HiUser, HiAtSymbol } from 'react-icons/hi2';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: 'like' | 'repost' | 'comment' | 'follow' | 'mention';
  fromUserId: string;
  fromUserName: string;
  fromUserImage: string | null;
  fromUserUserId: string;
  toUserId: string;
  postId: string | null;
  commentId: string | null;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && session) {
      fetchNotifications();
      
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
            fetchNotifications();
          });

          return () => {
            channel.unbind_all();
            pusher.unsubscribe(`user-${session.user.id}`);
            pusher.disconnect();
          };
        }
      }
    }
  }, [status, session, router]);

  const fetchNotifications = async () => {
    if (!session?.user?.id) return;
    
    try {
      setLoading(true);
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        
        // Mark all as read when viewing the page
        const unreadIds = (data.notifications || [])
          .filter((n: Notification) => !n.read)
          .map((n: Notification) => n.id);
        
        if (unreadIds.length > 0) {
          await markAsRead(unreadIds);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds, read: true }),
      });
      setNotifications((prev) =>
        prev.map((n) =>
          notificationIds.includes(n.id) ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case 'like':
        return '點讚了你的貼文';
      case 'repost':
        return '轉發了你的貼文';
      case 'comment':
        return '評論了你的貼文';
      case 'follow':
        return '開始追蹤你';
      case 'mention':
        return notification.commentId ? '在留言中提到了你' : '在貼文中提到了你';
      default:
        return '';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <HiHeart className="w-5 h-5 text-red-500 fill-current" />;
      case 'repost':
        return <HiArrowPathRoundedSquare className="w-5 h-5 text-green-500 fill-current" />;
      case 'comment':
        return <HiChatBubbleLeft className="w-5 h-5 text-blue-500" />;
      case 'follow':
        return <HiUser className="w-5 h-5 text-purple-500 fill-current" />;
      case 'mention':
        return <HiAtSymbol className="w-5 h-5 text-orange-500 fill-current" />;
      default:
        return null;
    }
  };

  if (status === 'loading' || !session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
        <div className="flex items-center space-x-4 px-4 py-3">
          <button
            onClick={() => router.push('/home')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <HiArrowLeft className="text-2xl" />
          </button>
          <div>
            <h1 className="text-xl font-bold">通知</h1>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">載入中...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">沒有通知</div>
        ) : (
          notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => {
                if (notification.type === 'follow' || !notification.postId) {
                  router.push(`/profile/${notification.fromUserUserId}`);
                } else if (notification.postId) {
                  router.push(`/home`);
                }
              }}
              className={`w-full p-4 hover:bg-gray-50 transition-colors text-left ${
                !notification.read ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                {notification.fromUserImage && (
                  <img
                    src={notification.fromUserImage}
                    alt={notification.fromUserName}
                    className="w-12 h-12 rounded-full cursor-pointer flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/profile/${notification.fromUserUserId}`);
                    }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    {getNotificationIcon(notification.type)}
                    <span
                      className="font-semibold hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/profile/${notification.fromUserUserId}`);
                      }}
                    >
                      {notification.fromUserName}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {getNotificationText(notification)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}


