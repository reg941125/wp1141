'use client';

import { useState } from 'react';

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
  onToggle: () => void;
}

export default function FollowButton({
  userId,
  isFollowing,
  onToggle,
}: FollowButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);

    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: isFollowing ? 'DELETE' : 'POST',
      });

      if (res.ok) {
        onToggle();
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-4 py-2 rounded-full font-semibold ${
        isFollowing
          ? 'border border-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-600'
          : 'bg-black text-white hover:bg-gray-800'
      } disabled:opacity-50`}
    >
      {loading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
    </button>
  );
}

