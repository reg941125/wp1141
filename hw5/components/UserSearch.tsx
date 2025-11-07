'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { HiMagnifyingGlass } from 'react-icons/hi2';

interface User {
  id: string;
  userId: string;
  name: string | null;
  image: string | null;
}

interface UserSearchProps {
  onUserSelect?: () => void;
}

export default function UserSearch({ onUserSelect }: UserSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Search users when query changes
  useEffect(() => {
    if (query.trim().length === 0) {
      setUsers([]);
      setShowDropdown(false);
      return;
    }

    // Debounce search
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setLoading(true);
    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users || []);
          setShowDropdown(data.users && data.users.length > 0);
        } else {
          setUsers([]);
          setShowDropdown(false);
        }
      } catch (error) {
        console.error('Error searching users:', error);
        setUsers([]);
        setShowDropdown(false);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUserSelect = (user: User) => {
    router.push(`/profile/${user.userId}`);
    setQuery('');
    setShowDropdown(false);
    if (onUserSelect) {
      onUserSelect();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowDropdown(false);
      setQuery('');
    } else if (e.key === 'Enter' && users.length > 0) {
      e.preventDefault();
      handleUserSelect(users[0]);
    }
  };

  return (
    <div ref={searchRef} className="relative w-full mb-4">
      <div className="relative">
        <HiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (users.length > 0) {
              setShowDropdown(true);
            }
          }}
          placeholder="搜尋用戶..."
          className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full border-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {showDropdown && users.length > 0 && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {users.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => handleUserSelect(user)}
              className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors text-left"
            >
              {user.image && (
                <img
                  src={user.image}
                  alt={user.name || user.userId}
                  className="w-10 h-10 rounded-full flex-shrink-0"
                />
              )}
              {!user.image && (
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-600 text-sm font-medium">
                    {(user.name || user.userId || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">
                  {user.name || '未設定名稱'}
                </div>
                <div className="text-gray-500 text-xs truncate">
                  @{user.userId}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showDropdown && query.trim().length > 0 && !loading && users.length === 0 && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm">
          找不到用戶
        </div>
      )}
    </div>
  );
}

